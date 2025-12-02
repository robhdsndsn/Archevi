<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Find all open-source or self-hosted RAG frameworks and document AI tools that have gained traction in 2024-2025. What are developers saying about them on GitHub, Reddit, and Hacker News?

Now I have gathered comprehensive information about open-source and self-hosted RAG frameworks and document AI tools from 2024-2025. Let me compile this into a detailed report with developer sentiment from GitHub, Reddit, and Hacker News.

## Open-Source and Self-Hosted RAG Frameworks and Document AI Tools: 2024-2025 Landscape

The open-source RAG and document AI ecosystem has exploded in 2024-2025, with significant momentum around new tools, mature frameworks reaching production readiness, and a clear shift toward agentic RAG systems. Here's what developers are saying across platforms.

### **Major RAG Frameworks Gaining Traction**

#### **LangChain (121k+ GitHub stars)**[^1_1]

LangChain remains the most popular framework despite growing criticism. Developers praise its massive integration ecosystem and flexibility, but sentiment has become mixed:[^1_2][^1_3]

**Developer feedback highlights:** Developers complain about **dependency bloat** and "unnecessary complexity," with one Reddit user noting LangChain introduced "way too many layers of abstraction" that made it harder to change implementation details. **Frequent breaking changes** have been a major pain point, with another developer stating "every 5th-ish release broke something" and describing the framework as a "moving target" throughout 2023. **Poor documentation** remains a persistent complaint, with frustrated users calling the official docs "atrocious and inconsistent." **Hidden overheads** in token usage have caused users to see unexpectedly high API costs due to inefficient context management and internal API calls.[^1_3][^1_2]

However, developers acknowledge LangChain's unmatched integration breadth for rapid prototyping and experimental RAG work.[^1_4]

#### **LlamaIndex (~80k GitHub stars)**[^1_5][^1_6]

LlamaIndex has positioned itself as a data-focused alternative to LangChain, emphasizing ease of use and RAG-specific capabilities. Community feedback is notably more positive:[^1_7]

**Developer sentiment:** Reddit discussions note that "LlamaIndex is pretty good" for building advanced Q\&A systems with a "data-first philosophy." Developers appreciate its 160+ data connectors (LlamaHub), simplifying document ingestion from PDFs, SQL databases, Notion, and Slack. The framework is praised for making it "faster to go from zero to working prototype." However, some note that while easy to start, advanced customization can become complex.[^1_8][^1_9][^1_5][^1_7]

Recent developments include LlamaIndex's **Workflows 1.0** and **llama-agents** for agentic systems, signaling a strategic pivot toward multi-agent orchestration.[^1_5]

#### **Haystack 2.0 (13k+ GitHub stars)**[^1_4]

Haystack 2.0 (released March 2024) brought significant improvements and stands out for **production-grade reliability and evaluation**.[^1_10][^1_4]

**Developer praise:** Developers value Haystack's **explicit RAG pipelines** with built-in evaluation, making it ideal for regulated industries where accuracy and auditability matter. The framework's **flexible component system** and seamless integration with Hugging Face and OpenAI are highlighted. A Hacker News discussion showed developers building custom components (e.g., HackerNews fetchers) with just a few lines of code.[^1_11][^1_12][^1_10][^1_4]

Compared to LangChain, Haystack is described as "more flexible and easy to use" with a "clearer pipeline structure ideal for audits and debugging." Best used for scenarios requiring accuracy, compliance, and transparency—such as legal research and policy Q\&A.[^1_10][^1_4]

#### **LangGraph (part of LangChain ecosystem)**[^1_4]

LangGraph emerged as the **top choice for complex, agentic RAG orchestration** in 2025.[^1_4]

**Key strengths:** Graph-based orchestration for multi-agent, multi-step workflows; checkpointing and human-in-the-loop controls; streaming output and LangGraph Studio for observability. Developers appreciate its support for **Corrective RAG (CRAG)** and **Adaptive RAG** patterns.[^1_4]

**Limitations:** The learning curve is steep, and it's considered "overkill for simple, static RAG setups." Developers note that building production systems requires significant expertise.[^1_4]

***

### **Document AI and Parsing Tools**

#### **Docling (44.8k GitHub stars, \#1 trending in November 2024)[^1_13][^1_14]

Docling, IBM's open-source document parsing toolkit released in July 2024, **gained 10,000 stars in less than a month** and was GitHub's \#1 trending repository worldwide in November 2024.[^1_14]

**Developer enthusiasm is exceptional:** Reddit and social media praise Docling as having **"the best output quality of all open-source solutions,"** with one developer noting it achieves results "30 times faster" by avoiding traditional OCR. The tool's ability to parse PDFs, DOCX, PPTX, and images into clean Markdown or JSON is highlighted as game-changing for RAG systems. Developers appreciate the **layout-aware parsing** using deep learning models (DocLayNet for layout, TableFormer for tables), which preserves structure far better than text-based chunking.[^1_15][^1_13][^1_14]

**Community adoption:** Docling has been rapidly integrated into LangChain, LlamaIndex, and Haystack. Academic papers and enterprise projects cite it widely. Developers in specialized domains (scientific papers, manuals, patents) report superior performance compared to alternatives.[^1_13][^1_15][^1_14]

**Limitations:** Docling struggles with scanned documents and handwriting recognition (OCR-heavy tasks). For digital-first PDFs, it excels.[^1_16]

#### **MarkItDown by Microsoft (25k+ GitHub stars, gained 25k in 2 weeks)**[^1_17][^1_18]

Released in late 2024, MarkItDown rapidly gained traction as a lightweight, universal file converter targeting LLM workflows.

**Developer reception:** Developers praise its **universal file support** (DOCX, PPTX, XLSX, PDF, HTML, images, audio, YouTube URLs) and clean Markdown output perfect for RAG pipelines. The **MCP server integration** allowing LLM clients to convert files on-demand is well-received. One developer noted it's "simple and convenient," solving the document preprocessing bottleneck for AI teams.[^1_19][^1_18][^1_20][^1_17]

**Trade-offs:** MarkItDown is lightweight but less feature-rich than Docling. It excels at format conversion but lacks the deep document understanding capabilities (e.g., form extraction, advanced table recognition) that Docling provides.[^1_16]

**Community feedback:** Reddit discussions favor MarkItDown for quick prototyping and LLM input preparation, while Docling is preferred when document structure preservation is critical.[^1_21]

#### **Unstructured.io (open-source library)**

Unstructured offers modular components for document ingestion and preprocessing.

**Developer sentiment:** Appreciated for its flexibility and integration with major RAG frameworks, but viewed as requiring more manual configuration than Docling or MarkItDown. Favored by teams building custom data pipelines.[^1_22]

***

### **Fully Integrated RAG Platforms**

#### **RAGFlow (68.3k GitHub stars)**[^1_23][^1_24]

RAGFlow, open-sourced by InfiniFlow in April 2024, has become a dominant force in the RAG space.

**Key innovations:** RAGFlow pioneered **semantic chunking for unstructured data**, establishing design principles now adopted industry-wide. The framework introduced **BM25 and hybrid search**, making pure vector databases unnecessary as a separate category. Its deep document understanding (similar to Docling) and agentic workflow support positioned it as a comprehensive solution.[^1_24][^1_23]

**Developer experience:** Developers appreciate RAGFlow's **visual chunking interface** with human-in-the-loop adjustments, allowing transparent verification of document parsing. Integration with multiple LLMs and vector databases is seamless. Reddit discussions note that **RAGFlow solved problems** that existed before, particularly around semantic gaps in retrieval.[^1_25][^1_23][^1_24]

**Traction:** By end of 2024, RAGFlow had 26,000+ stars (now 68.3k). Widely adopted in enterprises for production RAG systems.[^1_24]

#### **Danswer (10k+ GitHub stars)**[^1_26]

Danswer, an open-source unified search tool for team documents, crossed 10k GitHub stars in August 2024.[^1_26]

**Developer feedback:** Praised for solving real problems—support teams use it to reduce documentation lookup time, and engineering teams use it for code/changelog search. Hacker News discussions highlight its ease of setup and accurate retrieval. The Slack integration is particularly valued.[^1_27][^1_28]

**Recognition:** The team shared learnings on Hacker News about gaining traction, noting that **HN community support** and GitHub trending are crucial for visibility. Developers describe Danswer as filling a genuine gap in workplace knowledge access.[^1_26]

#### **AnythingLLM (50k+ GitHub stars)**[^1_29][^1_30]

AnythingLLM surpassed 50,000 GitHub stars in October 2025, representing "explosive global demand" for user-first, on-device AI.[^1_29]

**Developer highlights:** Over **5 million global installs**, making it one of the most widely used open-source RAG platforms. Developers appreciate its **all-in-one approach** combining RAG, AI agents, no-code agent builder, and MCP compatibility. The v1.9.0 release introduced **agent streaming** and real-time web document ingestion, addressing key pain points.[^1_30][^1_31][^1_29]

**Community sentiment:** Praised for removing friction from RAG deployment and being "dead-simple" to use compared to framework-heavy alternatives.[^1_30]

#### **Dify (110k GitHub stars)**[^1_32][^1_33]

Dify is a leading low-code LLMOps platform with RAG and agent capabilities.

**Strengths:** Comprehensive low-code UI combined with powerful backend RAG pipelines and agent orchestration; rapid prototyping for non-technical users; enterprise-ready (audit logs, SSO); extensive model provider integrations.[^1_34][^1_33]

**Developer adoption:** Reddit and GitHub discussions show Dify is favored for **production deployments** where teams want speed to market without sacrificing customization. Docker Compose self-hosting is well-documented.[^1_35][^1_34]

**Considerations:** Some advanced developers find it "higher level" with less low-level control than pure framework approaches.[^1_34]

***

### **Specialized and Emerging Frameworks**

#### **LightRAG (23k+ GitHub stars, 1-year anniversary milestone)**[^1_36][^1_37]

LightRAG, a graph-based RAG framework from Hong Kong researchers, reached 23k stars and 1000+ PRs in its first year.

**Innovation:** LightRAG uses **knowledge graph indexing** instead of pure vector search, enabling **multi-hop reasoning** while using **fewer than 100 tokens per retrieval**—orders of magnitude more efficient than traditional GraphRAG approaches.[^1_38]

**Developer feedback:** Enthusiasts highlight LightRAG's ability to solve "complex queries that require multi-hop reasoning," addressing a core RAG limitation. Reddit discussions and hands-on reviews show smooth local deployment with Ollama (open-source LLMs).[^1_39][^1_38]

**Limitations:** Smaller ecosystem than LangChain/LlamaIndex; still evolving (though rapidly gaining maturity).[^1_40]

#### **DSPy (28k+ GitHub stars)**[^1_41]

DSPy, from Stanford NLP/Databricks, promotes "programming, not prompting" with modular, signature-based abstractions.

**Mixed sentiment:** Developers appreciate the **conceptual innovation** of separating programming from prompting and automatic prompt optimization. However, the framework faces criticism for **poor software design**, buggy implementation, and inadequate documentation. Reddit discussions note it's "not yet production-ready" despite the compelling idea. Complex use cases beyond RAG (agents, chat) are difficult to implement.[^1_42]

**Verdict:** Best for RAG-specific optimization but not recommended for broader agent systems.[^1_42]

#### **LLMWare (12.7k GitHub stars)**[^1_43]

LLMWare specializes in efficient RAG using small, specialized models instead of massive LLMs.

**Positioning:** Ideal for **edge deployment and CPU-only hardware**. Comprehensive document processing and flexible vector database options.[^1_44][^1_43]

**Community size:** Smaller than LangChain/LlamaIndex but growing; less prominent in Reddit/HN discussions compared to larger frameworks.

***

### **Multi-Agent and Agentic RAG Frameworks**

#### **CrewAI (trending in 2024-2025)**[^1_45]

CrewAI is a lean, standalone multi-agent framework emphasizing simplicity and performance.

**Key appeal:** **5.76x faster** than LangGraph in certain benchmarks; independent of LangChain overhead; seamless Crews (autonomy) + Flows (precision) orchestration; production-grade.[^1_45]

**Developer sentiment:** Positioned as an alternative to LangGraph and AutoGen, valued for real-world automation where speed and flexibility matter.[^1_46]

#### **AutoGen (Microsoft)**[^1_47]

AutoGen enables **multi-agent conversations** but lacks inherent process structure.

**Limitations:** AutoGen requires additional programming to orchestrate agent interactions; not suitable for production without significant customization. However, **AutoGen Studio** (low-code UI) lowers the barrier for experimentation.[^1_48][^1_45]

***

### **Key Trends and Developer Consensus**

**1. Agentic RAG is the new frontier (2025).**[^1_47][^1_24][^1_4]

- Frameworks like LangGraph, CrewAI, and AutoGen dominate production discussions.
- Multi-hop reasoning and dynamic retrieval strategies address RAG's semantic gap problem.[^1_24]

**2. Document parsing is commoditizing but quality varies wildly.**[^1_49][^1_21][^1_16]

- Docling and MarkItDown set high bars for quality and ease of use.
- Benchmark comparisons show significant performance gaps across document types—no single tool dominates.[^1_49]

**3. LangChain criticism has reached a tipping point.**[^1_2][^1_3]

- Developers are actively exploring alternatives (LlamaIndex, Haystack, LightRAG).
- Over-abstraction and hidden costs are pushing teams toward lighter frameworks.[^1_2]

**4. Open-source adoption is surging but with caveats.**

- Tools like Docling (10k stars in <1 month) and MarkItDown (25k in 2 weeks) demonstrate massive demand.[^1_14][^1_17]
- Production readiness remains a concern for newer frameworks; proven tools like LangChain and Haystack are still preferred for critical deployments.[^1_4]

**5. Hybrid search and knowledge graphs are becoming standard.**[^1_24]

- RAGFlow and LightRAG demonstrate that combining vector, sparse, and graph-based retrieval outperforms single-method approaches.[^1_24]
- BM25 has made a surprising comeback as essential for RAG.[^1_24]

**6. Local and self-hosted solutions dominate Reddit/HN conversations.**

- Privacy concerns and cost optimization drive interest in frameworks supporting local LLMs (Ollama, Llama 2, Qwen).[^1_40][^1_39]
- Docker Compose deployments are now table stakes for open-source tools.[^1_35]

***

### **Recommendations by Use Case**

| **Use Case** | **Recommended Framework** | **Key Reason** |
| :-- | :-- | :-- |
| **Complex agentic workflows** | LangGraph, CrewAI | Graph-based orchestration and HITL support |
| **Rapid RAG prototyping** | LlamaIndex, Dify | Ease of use and data connector breadth |
| **Production accuracy/compliance** | Haystack 2.0 | Explicit pipelines and evaluation ergonomics |
| **Lightweight, simple RAG** | LightRAG, AnythingLLM | Efficiency and quick deployment |
| **Document parsing quality** | Docling (complex layouts), MarkItDown (universal) | Best-in-class conversion accuracy |
| **Enterprise all-in-one** | Dify, RAGFlow | Feature completeness and community support |
| **Cost-conscious self-hosting** | LLMWare, LightRAG | Edge deployment and CPU efficiency |

The landscape is mature, competitive, and rapidly evolving—with clear winners in specific niches but no single dominant player across all use cases.
<span style="display:none">[^1_50][^1_51][^1_52][^1_53][^1_54][^1_55][^1_56][^1_57][^1_58][^1_59][^1_60][^1_61][^1_62][^1_63][^1_64][^1_65][^1_66][^1_67][^1_68][^1_69][^1_70][^1_71][^1_72][^1_73][^1_74][^1_75][^1_76][^1_77][^1_78][^1_79][^1_80][^1_81][^1_82][^1_83][^1_84][^1_85][^1_86][^1_87][^1_88][^1_89][^1_90][^1_91][^1_92][^1_93][^1_94][^1_95][^1_96]</span>

<div align="center">⁂</div>

[^1_1]: https://www.linkedin.com/posts/jainn-sparsh_langchain-currently-has-121k-stars-on-github-activity-7399756417936613376--ty_

[^1_2]: https://www.designveloper.com/blog/is-langchain-bad/

[^1_3]: https://www.reddit.com/r/LangChain/comments/1gmfyi2/why_are_people_hating_langchain_so_much/

[^1_4]: https://alphacorp.ai/top-5-rag-frameworks-november-2025/

[^1_5]: https://skywork.ai/skypage/en/LlamaIndex-Deep-Dive-The-Secret-Weapon-for-Production-Ready-AI-in-2025/1972843578360786944

[^1_6]: https://www.llamaindex.ai/blog/announcing-our-series-a-and-llamacloud-general-availability

[^1_7]: https://news.ycombinator.com/item?id=38760098

[^1_8]: https://github.com/run-llama/llama_index

[^1_9]: https://www.youtube.com/watch?v=sw_IK4M7S0A

[^1_10]: https://www.ampcome.com/articles/langchain-vs-haystack

[^1_11]: https://www.youtube.com/watch?v=SZJUsFObB9g

[^1_12]: https://news.ycombinator.com/item?id=39667569

[^1_13]: https://github.com/docling-project/docling

[^1_14]: https://arxiv.org/abs/2501.17887

[^1_15]: https://research.ibm.com/blog/docling-generative-AI

[^1_16]: https://unstract.com/blog/docling-alternative/

[^1_17]: https://leapcell.io/blog/deep-dive-into-microsoft-markitdown

[^1_18]: https://dev.to/leapcell/deep-dive-into-microsoft-markitdown-4if5

[^1_19]: https://github.com/microsoft/markitdown

[^1_20]: https://github.com/microsoft/markitdown/issues/12

[^1_21]: https://www.reddit.com/r/LangChain/comments/1dzj5qx/best_pdf_parser_for_rag/

[^1_22]: https://docs.unstructured.io/open-source/introduction/overview

[^1_23]: https://github.com/infiniflow/ragflow

[^1_24]: https://ragflow.io/blog/the-rise-and-evolution-of-rag-in-2024-a-year-in-review

[^1_25]: https://becomingahacker.org/ragflow-an-open-source-retrieval-augmented-generation-rag-engine-6b903005a032

[^1_26]: https://www.linkedin.com/posts/yuhongsun_danswer-just-crossed-10k-github-stars-and-activity-7228778776883519488-zEa1

[^1_27]: https://news.ycombinator.com/item?id=39467413

[^1_28]: https://news.ycombinator.com/item?id=37677473

[^1_29]: https://www.linkedin.com/posts/timothy-carambat_were-absolutely-thrilled-to-announce-a-major-activity-7386096377136816128-Unnq

[^1_30]: https://github.com/Mintplex-Labs/anything-llm

[^1_31]: https://github.com/Mintplex-Labs/anything-llm/releases

[^1_32]: https://docs.anythingllm.com/introduction

[^1_33]: https://skywork.ai/blog/dify-review-buyers-guide-2025/

[^1_34]: https://aixsociety.com/comparing-dify-ai-and-leading-low‑code-llmops-platforms/

[^1_35]: https://milvus.io/blog/hands-on-tutorial-build-rag-power-document-assistant-in-10-minutes-with-dify-and-milvus.md

[^1_36]: https://www.linkedin.com/posts/chao-huang-208993177_lightrag-just-hit-its-1-year-mark-23k-activity-7396530074818134016-QN1T

[^1_37]: https://github.com/HKUDS/LightRAG

[^1_38]: https://www.linkedin.com/posts/bezerraescossia_github-hkudslightrag-emnlp2025-lightrag-activity-7395070266311086080-hRTt

[^1_39]: https://dev.to/aairom/hands-on-experience-with-lightrag-3hje

[^1_40]: https://latenode.com/blog/ai/frameworks-tech/best-rag-frameworks-2025-complete-enterprise-and-open-source-comparison

[^1_41]: https://www.designveloper.com/blog/what-is-dspy/

[^1_42]: https://www.reddit.com/r/LangChain/comments/1cqexk6/thoughts_on_dspy/

[^1_43]: https://www.firecrawl.dev/blog/best-open-source-rag-frameworks

[^1_44]: https://github.com/llmware-ai/llmware

[^1_45]: https://github.com/crewAIInc/crewAI

[^1_46]: https://lorenzejay.dev/articles/practical-agentic-rag

[^1_47]: https://toloka.ai/blog/agentic-rag-systems-for-enterprise-scale-information-retrieval/

[^1_48]: https://qdrant.tech/articles/agentic-rag/

[^1_49]: https://arxiv.org/html/2410.09871v1

[^1_50]: https://news.ycombinator.com/item?id=36667374

[^1_51]: https://docs.anythingllm.com/agent-flows/tutorial-hackernews

[^1_52]: https://news.ycombinator.com/item?id=36667949

[^1_53]: https://www.reddit.com/r/hackernews/comments/1btpaur/ragflow_is_an_opensource_rag_engine_based_on_ocr/

[^1_54]: https://docs.anythingllm.com/nvidia-nims/introduction

[^1_55]: https://news.ycombinator.com/item?id=39896923

[^1_56]: https://research.aimultiple.com/agentic-frameworks/

[^1_57]: https://apidog.com/blog/best-open-source-rag-frameworks/

[^1_58]: https://www.zenml.io/blog/best-llm-orchestration-frameworks

[^1_59]: https://github.com/topics/agentic-rag?o=asc\&s=forks

[^1_60]: https://www.morphik.ai/blog/guide-to-oss-rag-frameworks-for-developers

[^1_61]: https://www.reddit.com/r/LangChain/comments/1hvcr5s/production_rag_what_orchestration_framework_is/

[^1_62]: https://docs.langchain.com/oss/python/langgraph/agentic-rag

[^1_63]: https://www.alphamatch.ai/blog/rag-tools-comparison-2025

[^1_64]: https://www.linkedin.com/pulse/assessment-microsofts-markitdown-series-1parse-pdf-tables-alex-zhang-xer6c

[^1_65]: https://github.com/Unstructured-IO/unstructured

[^1_66]: https://docling-project.github.io/docling/

[^1_67]: https://denshub.com/en/markitdown-doc-conversion-tool/

[^1_68]: https://www.tigerdata.com/blog/parsing-all-the-data-with-open-source-tools-unstructured-and-pgai

[^1_69]: https://github.com/docling-project

[^1_70]: https://news.ycombinator.com/item?id=43128676

[^1_71]: https://news.ycombinator.com/item?id=45351644

[^1_72]: https://github.com/docling-project/docling/discussions/243

[^1_73]: https://news.ycombinator.com/item?id=44780353

[^1_74]: https://pathway.com/blog/multimodal-data-processing

[^1_75]: https://www.linkedin.com/pulse/top-20-open-source-ai-projects-most-github-stars-nocobase-stcoc

[^1_76]: https://github.com/tooploox/danswer

[^1_77]: https://www.fondo.com/blog/danswer-launches

[^1_78]: https://github.com/danswer-ai/danswer/issues/1384

[^1_79]: https://www.nocobase.com/en/blog/github-open-source-ai-projects

[^1_80]: https://github.com/deepset-ai/haystack-integrations/blob/main/integrations/fastrag.md

[^1_81]: https://www.projectpro.io/article/langchain-projects/959

[^1_82]: https://github.com/deepset-ai/haystack-rag-app

[^1_83]: https://github.com/langchain-ai

[^1_84]: https://www.reddit.com/r/LangChain/comments/1bbog83/langchain_vs_llamaindex/

[^1_85]: https://www.youtube.com/watch?v=jCBUmd6QVCg

[^1_86]: https://news.ycombinator.com/item?id=40739982

[^1_87]: https://www.fullstacko.com/blog/langchain-vs-llamaindex/

[^1_88]: https://www.reddit.com/r/LangChain/

[^1_89]: https://milvus.io/ai-quick-reference/can-i-use-llamaindex-for-realtime-document-tagging

[^1_90]: https://thehackernews.com/2025/01/metas-llama-framework-flaw-exposes-ai.html

[^1_91]: https://docling-project.github.io/docling/examples/rag_llamaindex/

[^1_92]: https://circleci.com/blog/llamaindex-rag-app/

[^1_93]: https://www.reddit.com/r/LocalLLaMA/comments/1ghbmoq/docling_is_a_new_library_from_ibm_that/

[^1_94]: https://news.ycombinator.com/item?id=42957085

[^1_95]: https://developers.llamaindex.ai/python/framework-api-reference/readers/reddit/

[^1_96]: https://www.reddit.com/r/LocalLLaMA/comments/1ox9fzy/is_there_a_selfhosted_opensource_plugandplay_rag/

