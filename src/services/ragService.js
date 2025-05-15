import { askOpenAI } from "../api";

// Knowledge Management Class
class KnowledgeBase {
  constructor() {
    this.documents = [
      {
        id: 1,
        content:
          "Semantic Kernel is an SDK that allows integrating AI services into applications.",
        tags: ["semantic kernel", "sdk", "ai", "integration"],
      },
      {
        id: 2,
        content:
          "RAG stands for Retrieval-Augmented Generation and combines information retrieval with text generation.",
        tags: ["rag", "retrieval", "generation", "text generation"],
      },
      {
        id: 3,
        content:
          "Azure OpenAI Service provides REST API accessibility to OpenAI's powerful language models.",
        tags: ["azure", "openai", "api", "language model"],
      },
    ];
  }

  // Add documents (could be loaded from files, database, etc.)
  addDocument(content, tags = []) {
    const id = this.documents.length + 1;
    this.documents.push({
      id,
      content,
      tags: [...tags, ...this.extractKeywords(content)],
    });
    return id;
  }

  // Extract keywords from content (simplified version)
  extractKeywords(content) {
    // Simple extraction of common nouns (could be improved with NLP)
    const words = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const stopWords = [
      "and",
      "or",
      "but",
      "the",
      "for",
      "this",
      "that",
      "with",
    ];
    return [...new Set(words.filter((w) => !stopWords.includes(w)))];
  }

  // Verbesserte Suchfunktion, die dynamisch mit allen Knowledge-Arten umgehen kann

  // Search for relevant documents
  search(query) {
    console.log("Searching for:", query);

    const lowercaseQuery = query.toLowerCase();

    // Break query into keywords for more flexible matching
    const queryKeywords = lowercaseQuery
      .split(/\s+/)
      .filter((word) => word.length > 1) // Include shorter words too
      .map((word) => word.replace(/[?.,!]/g, "")); // Remove punctuation

    console.log("Search terms:", queryKeywords);

    // Score calculation with improved matching
    const results = this.documents.map((doc) => {
      const docContent = doc.content.toLowerCase();
      const docTags = doc.tags.map((tag) => tag.toLowerCase());

      let score = 0;
      let exactPhraseMatch = false;

      // Check for exact phrase match (highest priority)
      if (docContent.includes(lowercaseQuery)) {
        score += 10; // Exact phrase match is highly relevant
        exactPhraseMatch = true;
      }

      // Check for individual keyword matches in content
      queryKeywords.forEach((keyword) => {
        // Different scoring based on match type
        if (docContent.includes(` ${keyword} `)) {
          score += 3; // Full word match with boundaries
        } else if (docContent.includes(keyword)) {
          score += 2; // Partial match
        }

        // Check tag matches (more precise matching)
        if (docTags.some((tag) => tag === keyword)) {
          score += 3; // Exact tag match
        } else if (docTags.some((tag) => tag.includes(keyword))) {
          score += 1; // Partial tag match
        }
      });

      // Boost documents with many matching keywords
      const uniqueMatches = queryKeywords.filter((keyword) =>
        docContent.includes(keyword)
      ).length;

      // Percentage of query keywords found in document
      const matchPercentage = uniqueMatches / queryKeywords.length;

      // Boost score based on coverage
      if (matchPercentage > 0.5) {
        score = score * (1 + matchPercentage);
      }

      return {
        doc,
        score,
        exactPhraseMatch,
      };
    });

    // Sort by score and filter out irrelevant docs
    const relevantResults = results
      .filter((result) => result.score > 0)
      .sort((a, b) => {
        // First by exact match (highest priority)
        if (a.exactPhraseMatch && !b.exactPhraseMatch) return -1;
        if (!a.exactPhraseMatch && b.exactPhraseMatch) return 1;

        // Then by score
        return b.score - a.score;
      });

    console.log(
      "Documents found:",
      relevantResults.map((r) => ({ id: r.doc.id, score: r.score }))
    );
    return relevantResults.map((result) => result.doc);
  }

  // Get all documents in the knowledge base
  getAllDocuments() {
    return [...this.documents];
  }

  // Get a document by ID
  getDocumentById(id) {
    return this.documents.find((doc) => doc.id === id);
  }

  // Update an existing document
  updateDocument(id, content, tags = []) {
    const index = this.documents.findIndex((doc) => doc.id === id);
    if (index === -1) {
      throw new Error(`Document with ID ${id} not found`);
    }

    this.documents[index] = {
      ...this.documents[index],
      content,
      tags: [...tags, ...this.extractKeywords(content)],
    };

    return this.documents[index];
  }

  // Delete a document
  deleteDocument(id) {
    const index = this.documents.findIndex((doc) => doc.id === id);
    if (index === -1) {
      throw new Error(`Document with ID ${id} not found`);
    }

    const deletedDoc = this.documents[index];
    this.documents.splice(index, 1);

    return deletedDoc;
  }
}

// Topic classification (simplified)
function classifyQuery(query) {
  const lowercaseQuery = query.toLowerCase();

  // Determine the topic domain of the query
  if (
    lowercaseQuery.includes("rag") ||
    lowercaseQuery.includes("retrieval") ||
    lowercaseQuery.includes("generation")
  ) {
    return "rag-domain";
  }
  if (
    lowercaseQuery.includes("semantic") ||
    lowercaseQuery.includes("kernel")
  ) {
    return "semantic-kernel-domain";
  }
  if (
    lowercaseQuery.includes("azure") ||
    lowercaseQuery.includes("api") ||
    lowercaseQuery.includes("openai")
  ) {
    return "azure-openai-domain";
  }

  return "general-domain";
}

// Create instance
const knowledgeBase = new KnowledgeBase();

// Verbessere die askQuestion-Funktion zur besseren Verarbeitung der dynamischen Knowledge-Base

export async function askQuestion(query) {
  try {
    // 1. Retrieve relevant documents with improved search
    const relevantDocs = knowledgeBase.search(query);

    // 2. Extract context from relevant documents
    const context = relevantDocs.map((doc) => doc.content).join("\n\n");
    console.log("Context used:", context);

    // 3. Create message structure for the API with improved prompting
    let systemPrompt;

    if (context.trim() === "") {
      // No relevant documents found - use default prompt
      systemPrompt =
        "You are a helpful assistant. Answer the question to the best of your knowledge.";
      console.log("No context found - Using default prompt");
    } else {
      // Create a dynamic prompt based on the retrieved information
      systemPrompt = `You are a helpful assistant with access to specific knowledge. 
      Answer the question based primarily on this information:
      
      ${context}
      
      Provide a direct and concise answer based on the provided information. 
      If the information doesn't fully answer the question, you may supplement with general knowledge, but prioritize the provided context.`;

      console.log("Using context-aware prompt");
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ];

    // 4. Send request to the LLM
    const response = await askOpenAI(messages);
    console.log("API response received");
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error in LLM request:", error);
    // More specific error message
    return `I couldn't process your question due to a technical issue. Details: ${error.message}`;
  }
}

// Export functions to add knowledge
export function addKnowledge(content, tags = []) {
  return knowledgeBase.addDocument(content, tags);
}

// Export additional knowledge management functions
export function getAllKnowledge() {
  return knowledgeBase.getAllDocuments();
}

export function getKnowledgeById(id) {
  return knowledgeBase.getDocumentById(id);
}

export function updateKnowledge(id, content, tags = []) {
  return knowledgeBase.updateDocument(id, content, tags);
}

export function deleteKnowledge(id) {
  return knowledgeBase.deleteDocument(id);
}

// Add this new function at the end of the file
export async function askQuestionWithoutContext(query) {
  const systemPrompt =
    "You are a helpful assistant. Answer the question to the best of your knowledge.";

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ];

  // Send request to the LLM
  try {
    const response = await askOpenAI(messages);
    console.log("API response without context received");
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error in LLM request (without context):", error);
    throw error;
  }
}
