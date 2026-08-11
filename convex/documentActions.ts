"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const MODEL = "claude-sonnet-5";

const EXTRACT_TOOL = {
  name: "record_financial_items",
  description:
    "Record every bill or loan found in the uploaded financial document.",
  input_schema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array",
        description:
          "One entry per bill or loan found in the document. A bank/CSV export may contain several.",
        items: {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: ["bill", "loan"],
              description:
                "'loan' for student loans, mortgages, auto loans, personal loans with a balance. 'bill' for everything else (utilities, subscriptions, credit cards, rent, shopping charges).",
            },
            name: {
              type: "string",
              description: "Biller / lender / merchant name",
            },
            amount: {
              type: "number",
              description:
                "The monthly payment amount (for loans) or the bill amount (for bills), in dollars",
            },
            dueDay: {
              type: "number",
              description: "Day of the month (1-31) the payment is due. Best guess if not explicit.",
            },
            category: {
              type: "string",
              enum: ["living", "loan", "discretionary"],
              description:
                "'living' = essential (rent, utilities, groceries, insurance, phone). 'loan' = any loan payment. 'discretionary' = optional/lifestyle spending (shopping, subscriptions, dining, entertainment).",
            },
            currentBalance: {
              type: "number",
              description: "Remaining balance owed (loans only)",
            },
            originalBalance: {
              type: "number",
              description: "Original principal (loans only, if known)",
            },
            interestRate: {
              type: "number",
              description: "Annual interest rate as a percent, e.g. 5.5 (loans only, if known)",
            },
            servicer: {
              type: "string",
              description: "Loan servicer name, if known",
            },
          },
          required: ["kind", "name", "amount", "dueDay", "category"],
        },
      },
    },
    required: ["items"],
  },
};

type ExtractedItem = {
  kind: "bill" | "loan";
  name: string;
  amount: number;
  dueDay: number;
  category: "living" | "loan" | "discretionary";
  currentBalance?: number;
  originalBalance?: number;
  interestRate?: number;
  servicer?: string;
};

export const parseDocument = internalAction({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.runMutation(internal.documents.getInternal, {
      documentId: args.documentId,
    });
    if (!doc) return;

    await ctx.runMutation(internal.documents.markProcessing, {
      documentId: args.documentId,
    });

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error(
          "ANTHROPIC_API_KEY is not set on the Convex deployment",
        );
      }

      const blob = await ctx.storage.get(doc.storageId);
      if (!blob) throw new Error("Uploaded file not found in storage");
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      const content: Record<string, unknown>[] = [];
      if (doc.mimeType === "application/pdf") {
        content.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        });
      } else if (doc.mimeType.startsWith("image/")) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: doc.mimeType,
            data: base64,
          },
        });
      } else {
        // csv / text
        const text = Buffer.from(arrayBuffer).toString("utf-8");
        content.push({
          type: "text",
          text: `File: ${doc.fileName}\n\n${text}`,
        });
      }

      content.push({
        type: "text",
        text: "Extract every bill or loan from this document and call record_financial_items. Use your best judgement for category and due day if not explicit.",
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          tools: [EXTRACT_TOOL],
          tool_choice: { type: "tool", name: "record_financial_items" },
          messages: [{ role: "user", content }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const toolUse = data.content?.find(
        (b: { type: string }) => b.type === "tool_use",
      );
      if (!toolUse) throw new Error("Model did not return structured data");

      const items: ExtractedItem[] = toolUse.input?.items ?? [];
      if (items.length === 0) {
        throw new Error("No bills or loans found in this document");
      }

      for (const item of items) {
        if (item.kind === "loan") {
          await ctx.runMutation(internal.documents.insertExtractedLoan, {
            userId: doc.userId,
            documentId: args.documentId,
            name: item.name,
            currentBalance: item.currentBalance ?? item.amount,
            originalBalance: item.originalBalance,
            interestRate: item.interestRate,
            monthlyPayment: item.amount,
            dueDay: item.dueDay,
            servicer: item.servicer,
          });
        } else {
          await ctx.runMutation(internal.documents.insertExtractedBill, {
            userId: doc.userId,
            documentId: args.documentId,
            biller: item.name,
            amount: item.amount,
            dueDay: item.dueDay,
            category: item.category,
          });
        }
      }

      await ctx.runMutation(internal.documents.markParsed, {
        documentId: args.documentId,
      });
    } catch (err) {
      await ctx.runMutation(internal.documents.markFailed, {
        documentId: args.documentId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
});
