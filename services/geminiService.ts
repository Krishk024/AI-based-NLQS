
import { GoogleGenAI, Type } from "@google/genai";
import { DB_SCHEMA } from "../constants";
import { QueryResponse } from "../types";

const getSchemaContext = () => {
  return DB_SCHEMA.map(t => 
    `Table: ${t.tableName}\nColumns: ${t.columns.join(', ')}\nDescription: ${t.description}`
  ).join('\n\n');
};

export const processNaturalLanguageQuery = async (query: string, context?: string): Promise<QueryResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        naturalLanguageSummary: {
          type: Type.STRING,
          description: "A brief explanation of what the query does in plain English."
        },
        generatedSql: {
          type: Type.STRING,
          description: "The valid MySQL query derived from the natural language input."
        },
        optimizationFeedback: {
          type: Type.STRING,
          description: "Feedback on query optimization."
        },
        resultDataJSON: {
          type: Type.STRING,
          description: "A stringified JSON array representing the result dataset (max 20 rows)."
        },
        visualizationSuggestion: {
          type: Type.STRING,
          enum: ['bar', 'line', 'pie', 'area', 'none'],
          description: "The best type of chart to visualize this data."
        },
        visualizationKeys: {
          type: Type.OBJECT,
          properties: {
            xAxis: { type: Type.STRING },
            dataKeys: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        chartDescription: {
          type: Type.STRING,
          description: "A detailed description specifically about the chart, trends, or outliers seen in the data."
        },
        recommendation: {
          type: Type.OBJECT,
          properties: {
            performanceLabel: { type: Type.STRING, description: "One of: positive, negative, neutral" },
            summary: { type: Type.STRING, description: "A high-level outcome headline (e.g., 'Revenue Peak in Q4')" },
            explanation: { type: Type.STRING, description: "A sophisticated data narrative using specific metrics and comparisons (e.g., 'A 70% increase in sales during...')" },
            impactLevel: { type: Type.STRING, description: "One of: High, Medium, Low" },
            recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable business strategy items." },
            followUpQueries: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Deep-dive questions for further analysis." }
          },
          required: ["performanceLabel", "summary", "explanation", "impactLevel", "recommendedActions", "followUpQueries"]
        }
      },
      required: ["naturalLanguageSummary", "generatedSql", "resultDataJSON", "visualizationSuggestion", "optimizationFeedback", "recommendation", "chartDescription"]
    };

    let systemInstruction = `
      You are an expert Senior Data Scientist and Business Intelligence Strategist.
      
      Your Role:
      1. Interpret natural language queries into efficient SQL.
      2. Simulate execution with high-fidelity mock data.
      3. CRITICAL: Your 'recommendation' must be elite-level business intelligence. 
         - Use specific percentages and trend analysis in the 'explanation'.
         - Identify seasonal patterns, anomalies, or correlations.
         - The 'summary' should be a punchy success/risk headline.
         - 'recommendedActions' must be strategic (e.g., 'Optimize inventory for SKU X', 'Target high-churn segments').
      4. Provide a 'chartDescription' that interprets visual trends for an executive audience.

      Rules:
      - Return max 20 rows in resultDataJSON.
      - Optimization feedback should focus on indexing, join efficiency, or aggregation strategy.
    `;

    if (context) {
        systemInstruction += `\n\nCONTEXT UPDATE: ${context}\nInfer the data structure from the provided context and generate a relevant response.`;
    } else {
        systemInstruction += `\n\nDatabase Schema:\n${getSchemaContext()}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);
    
    return {
        naturalLanguageSummary: parsed.naturalLanguageSummary,
        generatedSql: parsed.generatedSql,
        data: JSON.parse(parsed.resultDataJSON),
        visualizationSuggestion: parsed.visualizationSuggestion,
        visualizationKeys: parsed.visualizationKeys,
        optimizationFeedback: parsed.optimizationFeedback,
        recommendation: parsed.recommendation,
        chartDescription: parsed.chartDescription
    };

  } catch (error) {
    console.error("Error processing query:", error);
    throw error;
  }
};
