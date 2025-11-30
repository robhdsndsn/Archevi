# Launch Week Playbook

## Day-by-Day Execution Guide

This is your tactical playbook for launch week. Follow each day's checklist to maximize impact.

---

## Tuesday - Day 1: ProductHunt Launch

### Timeline

**12:01 AM PST** (3:01 AM EST)
- [ ] Launch goes live on ProductHunt
- [ ] Post first comment (personal story)
- [ ] Share to Twitter immediately
- [ ] Share to LinkedIn immediately

**6:00 AM EST** (Start of workday)
- [ ] Share to personal networks (email, Slack groups)
- [ ] Post in relevant Discord communities
- [ ] Alert beta users to upvote and comment
- [ ] Monitor comments - respond within 15 minutes

**9:00 AM EST**
- [ ] Post to HackerNews (subtle, authentic)
- [ ] Share in r/SideProject
- [ ] Send email to waitlist
- [ ] Post ProductHunt announcement on blog

**12:00 PM EST** (Lunch time - high engagement)
- [ ] Share to Facebook groups
- [ ] Post ProductHunt update #1 (milestone reached)
- [ ] Respond to all comments and questions
- [ ] Thank supporters publicly

**3:00 PM EST**
- [ ] Post ProductHunt update #2 (new milestone)
- [ ] Create Twitter thread with highlights
- [ ] Share on Instagram Stories (if applicable)
- [ ] Continue responding to comments

**6:00 PM EST** (Evening engagement)
- [ ] Final ProductHunt update for the day
- [ ] Thank everyone who supported
- [ ] Share on LinkedIn with reflections
- [ ] Plan for tomorrow based on feedback

### Day 1 Checklist
- [ ] Respond to every comment within 15 minutes
- [ ] Post 2-3 updates throughout the day
- [ ] Share to social media at least 5 times
- [ ] Send personal thank you messages to top supporters
- [ ] Monitor analytics hourly

**Goal**: Top 5 product of the day, 50+ upvotes, 500+ visits

---

## Wednesday - Day 2: Reddit Blitz

### Morning Posts (7:00-9:00 AM EST)

**Post 1: r/selfhosted** (7:00 AM)
```markdown
Title: "I built an open-source family knowledge base with RAG
 search - Archevi"

Body:
Hey r/selfhosted!

I spent the last 6 months building Archevi - a family
knowledge base with AI-powered semantic search.

**Why I built it:**
My family's information was scattered across Google Drive,
Notion, and random text files. When my mom asked "Where's
the home insurance policy?" for the 10th time, I realized
we needed something better.

**What it does:**
- Upload family documents (recipes, medical records, insurance, etc.)
- Ask questions in natural language
- Get instant answers with sources
- RAG-powered search (Cohere + pgvector)
- Complete privacy (your own isolated database)

**Tech stack:**
- Frontend: React + TypeScript + Vite
- Backend: Windmill + Python
- Database: PostgreSQL + pgvector
- AI: Cohere (embeddings + generation)

**Cost:**
- Managed service: $15-25/month (platform fee)
- You bring your own Cohere API key (~$2-5/month)
- Total: ~$17-30/month

**Demo video:** [link]

I'd love your feedback on the architecture and any suggestions
for improvement. Happy to answer technical questions!
```

**Post 2: r/privacy** (8:00 AM)
```markdown
Title: "Built a privacy-first alternative to Notion for families -
 with true data isolation"

Body:
Privacy-conscious folks,

Tired of storing family documents (medical records, financial
docs, etc.) in Google Drive or Notion? I built Archevi as a
privacy-first alternative.

**Key privacy features:**
- Each family gets isolated database (your data only)
- BYOK (Bring Your Own Key) - AI queries go directly to Cohere
- We never see your searches or documents
- PIPEDA compliant (Canada)
- Transparent architecture

**What it does:**
AI-powered semantic search over your family documents. Think
ChatGPT but trained only on your family's information, with
complete privacy.

**Example queries:**
- "What are dad's current medications?"
- "Where's the home insurance policy?"
- "What was grandma's cookie recipe?"

**Tech details:**
- PostgreSQL + pgvector for vector storage
- Cohere for embeddings (BYOK model)
- All data isolated per customer
- No telemetry, no tracking

Would love this community's thoughts on the security model
and any recommendations!
```

**Post 3: r/DataHoarder** (9:00 AM)
```markdown
Title: "RAG-powered search for your family's document hoard"

Body:
Fellow data hoarders,

You've got terabytes of family documents, photos, and files.
But can you actually find anything in there?

I built Archevi to solve this problem with semantic search:

**Before:** "I know we have that insurance document
 somewhere in these 50 folders..."

**After:** "Show me our home insurance policy" → instant answer

**How it works:**
1. Upload documents (txt, md, pdf, docx)
2. Automatically embedded with Cohere
3. Stored in PostgreSQL with pgvector
4. Ask questions in natural language
5. Get instant answers with sources

**Managed service:**
- Platform fee: $15-25/month
- Your own Cohere API key: ~$2-5/month
- Your own isolated database
- Complete control over your data

Who else is tired of Ctrl+F in their document hoard?
```

### Afternoon Posts (12:00-3:00 PM EST)

**Post 4: r/PersonalFinanceCanada** (12:00 PM)
```markdown
Title: "How I cut our family's knowledge management costs
 from $34/month to $20/month"

Body:
PFC community,

We were paying for:
- Notion: $10/month
- Evernote: $11/month
- Google One (2TB): $13/month
Total: $34/month = $408/year

**What we actually needed:**
A place to store and find family documents:
- Tax documents
- Insurance policies
- Medical records
- Recipes
- Emergency contacts

**Solution: Built Archevi (managed service)**
- Platform fee: ~$15/month
- Cohere API: ~$3/month
- Total: ~$18/month
- Savings: $192/year (47% reduction)
- Privacy bonus: Data in isolated database

**For the cost-conscious:**
- Platform handles everything
- You control your own AI costs
- Transparent pricing, no surprises

Anyone else tired of subscription creep?

[Cost breakdown chart]
```

### Evening Engagement (6:00-8:00 PM EST)
- [ ] Respond to all comments (aim for 100% response rate)
- [ ] Cross-post to relevant smaller subreddits
- [ ] Share top Reddit discussions on Twitter
- [ ] Post in Canadian city subreddits (subtle, valuable)

### Day 2 Checklist
- [ ] 4+ Reddit posts completed
- [ ] Respond to every comment within 30 minutes
- [ ] Share Reddit success on Twitter
- [ ] Note common questions for FAQ

**Goal**: 2000+ website visits, 50+ GitHub stars, 100+ email signups

---

## Thursday - Day 3: HackerNews & Technical Audience

### Morning (9:00 AM EST)

**HackerNews Post**:
```
Title: Show HN: Archevi - Family knowledge base with RAG search

https://archevi.ca

I built Archevi to solve a personal problem: my family's
information was scattered everywhere (Google Drive, Notion,
text files). When my mom asked "Where's the insurance policy?"
for the 10th time, I knew we needed better search.

Technical approach:
- RAG with Cohere embeddings (1024d)
- PostgreSQL + pgvector for storage
- Cohere rerank for improved retrieval
- React frontend, Python backend
- BYOK model (you bring your own Cohere API key)

Cost structure:
- Platform fee: $15-25/month
- Cohere API (BYOK): ~$2-5/month

The interesting technical challenge was balancing accuracy vs.
cost. Using Cohere instead of OpenAI reduced costs by ~90%
while maintaining quality.

Would love feedback on the architecture!

Demo: [link]
Docs: [link]
```

**First Comment** (Technical Details):
```
Some technical notes for those interested:

Embedding Strategy:
- Cohere embed-v4.0 (1024 dimensions)
- $0.10 per 1M tokens
- Document chunking: 500 tokens with 50 token overlap
- Typical family: ~$0.05/month for embeddings

Search Pipeline:
1. Query embedding (same model)
2. Cosine similarity search (pgvector)
3. Rerank top 10 with Cohere rerank-v3.5
4. Generate answer with Command-A
5. Total latency: ~2 seconds

Why pgvector over alternatives:
- Mature, battle-tested
- Native Postgres integration
- HNSW index for fast similarity search
- No additional infrastructure needed

Why Cohere over OpenAI:
- 90% cost reduction
- Comparable quality for this use case
- BYOK model enables true privacy

Database schema and more details in the docs.

Happy to answer any questions!
```

### Throughout the Day
- [ ] Monitor HN constantly (respond within 10 minutes)
- [ ] Answer technical questions thoroughly
- [ ] Don't be defensive about criticism
- [ ] Share interesting discussions on Twitter
- [ ] Post to Lobsters.rs mid-day

**Lobsters.rs Post** (12:00 PM):
```
Title: Archevi: Family knowledge base with RAG search

Tags: databases, ai, show

[Similar to HN post but tailored to Lobsters audience]

Focus on technical architecture, PostgreSQL usage, and
privacy aspects.
```

### Evening (6:00 PM)
- [ ] Write Twitter thread summarizing HN feedback
- [ ] Post on LinkedIn (professional angle)
- [ ] Update FAQ based on common questions
- [ ] Plan improvements based on feedback

### Day 3 Checklist
- [ ] HackerNews post live
- [ ] Respond to all comments within 15 minutes
- [ ] Lobsters post live
- [ ] Technical discussions documented
- [ ] GitHub issues created for good suggestions

**Goal**: HN front page, 2000+ visits, 100+ GitHub stars

---

## Friday - Day 4: Content Distribution

### Morning Email (8:00 AM EST)

**To: Waitlist**
```
Subject: Archevi is live: Your family's AI memory

Hey [Name],

After 6 months of building (and lots of help from beta
testers like you), Archevi is officially live!

What you can do today:
 Start your 14-day free trial
 Bring your own Cohere API key (~$2-5/month)
 Join our Discord community

 FOUNDING MEMBER OFFER
Be one of the first 100 customers and get:
- $9.99/month forever (normally $14.99)
- Priority support
- Influence on roadmap
- Lifetime discount

This offer expires in 7 days.

 Start your free trial: [link]

What's happening:
- ProductHunt: #3 product of the day
- HackerNews: Front page
- 100+ GitHub stars in 3 days
- Amazing feedback from early users

"Finally, a way to organize family info that actually works!"
- Sarah T., Beta Tester

Thank you for being part of this journey. I built Archevi
to solve my family's problem, and I hope it solves yours too.

Questions? Reply to this email - I read every one.

[Your Name]
Founder, Archevi

P.S. Check out the demo video: [link]
```

### Blog Syndication
- [ ] Post launch story to Medium
- [ ] Cross-post to Dev.to
- [ ] Share on Hashnode
- [ ] Post on Indie Hackers

### Social Media Blitz

**Twitter Thread** (10:00 AM):
```
 Thread: We launched Archevi this week. Here's what happened:

1/ Monday: Finished last-minute bug fixes. Barely slept.
 Nervous energy through the roof.

2/ Tuesday: Launched on ProductHunt at 12:01 AM.
 Set 7 alarms. Didn't need them - too excited to sleep.

3/ By noon: #3 product of the day. Mind blown.
 Your support means everything.

4/ Wednesday: Posted to Reddit. r/selfhosted loved the
 technical details. r/privacy loved the isolation.

5/ Thursday: Hit HackerNews front page. Server held up
 (barely). Learned a lot from the technical feedback.

6/ Today: 100+ GitHub stars, 100+ trial signups,
 15 paying customers already.

7/ What surprised me most: People care deeply about
 family data privacy. This isn't just about tech -
 it's about protecting what matters most.

8/ What's next: Listening to feedback, fixing bugs,
 adding most-requested features.

9/ Thank you to everyone who:
 - Tried the beta
 - Upvoted on PH
 - Starred on GitHub
 - Spread the word

10/ This is just the beginning. Building in public has
 been amazing. More updates soon!

 Try Archevi: [link]

What should I build next? 
```

**LinkedIn Post** (12:00 PM):
```
After 6 months of nights and weekends, I launched Archevi
this week - a family knowledge base with AI search.

The response has been incredible:
 #3 on ProductHunt
 HackerNews front page
 100+ GitHub stars
 100+ families trying it

Key lessons from the launch:

1. Privacy matters more than ever
People are tired of Big Tech knowing everything about their
families. Data isolation resonates.

2. Solve your own problems
I built this because my family needed it. Turns out
thousands of families have the same problem.

3. Transparency builds trust
The BYOK model (customers bring their own AI key) wasn't
just about cost - it was about trust.

4. Launch before you're ready
I wanted to add 10 more features. Good thing I didn't -
users told me what they actually need.

5. Community > marketing
Building in public and genuine engagement beat any marketing
strategy I could have planned.

What's next: Listening, iterating, and helping families
organize their knowledge.

If you're working on something, launch it. Today. You'll
learn more in one week of feedback than six months of planning.

#BuildInPublic #Startups

[Link to Archevi]
```

### Afternoon Outreach
- [ ] Email 5 tech bloggers with press release
- [ ] Share ProductHunt success with previous supporters
- [ ] Post in Slack communities
- [ ] Share in Discord servers (relevant ones)

### Video Upload
- [ ] Upload demo to YouTube (optimized title/description)
- [ ] Post on TikTok (if applicable)
- [ ] Share as Instagram Reel

### Day 4 Checklist
- [ ] Waitlist email sent
- [ ] Blog posts syndicated (3 platforms)
- [ ] Social media posts (Twitter thread, LinkedIn)
- [ ] Video content uploaded
- [ ] Outreach emails sent (5+)

**Goal**: Sustained traffic, 50+ trials started

---

## Saturday-Sunday - Days 5-7: Community Building

### Saturday Morning
- [ ] Post weekly reflection on Twitter
- [ ] Update GitHub README with launch stats
- [ ] Write blog post: "Launch Week Lessons"
- [ ] Respond to all outstanding comments/questions

### Saturday Afternoon
- [ ] Engage in Discord (welcome new members personally)
- [ ] Create #feature-requests channel
- [ ] Post weekly office hours schedule
- [ ] Plan next week's content

### Sunday
- [ ] Analyze week's metrics (spreadsheet)
- [ ] Calculate conversion rates
- [ ] Identify best-performing channels
- [ ] Review feedback for patterns
- [ ] Create GitHub issues for most-requested features
- [ ] Plan improvements for week 2

### Weekend Community Engagement
- [ ] Welcome every Discord member personally
- [ ] Respond to GitHub issues
- [ ] Answer emails (aim for <4 hour response time)
- [ ] Share user testimonials on social media
- [ ] Post gratitude/thank you on all platforms

### Analysis Tasks
```
Metrics to Calculate:
- Website visits per channel
- Email signup rate
- Trial start rate
- Trial-to-paid conversion rate
- Most popular features (usage data)
- Common drop-off points
- Support ticket themes

Actions:
- Double down on what's working
- Fix critical user experience issues
- Plan features based on feedback
- Adjust messaging based on resonance
```

### Weekend Checklist
- [ ] All comments/messages responded to
- [ ] Metrics analyzed and documented
- [ ] Next week planned
- [ ] Critical bugs fixed
- [ ] Testimonials collected and shared

**Goal**: 50+ total trials, 25+ paying customers, clear path forward

---

## Launch Week Assets Checklist

### ProductHunt
- [ ] Thumbnail (240x240)
- [ ] Gallery images (5-8 screenshots)
- [ ] GIF demo (shows key features)
- [ ] Tagline (60 chars max)
- [ ] Description (260 chars)
- [ ] First comment (personal story)

### Social Media
- [ ] Twitter header image
- [ ] LinkedIn banner
- [ ] Social share images (1200x630)
- [ ] Demo video (2-3 min)
- [ ] Short clips for TikTok/Reels

### Website
- [ ] Updated landing page
- [ ] "As seen on" section ready
- [ ] Live chat enabled
- [ ] Analytics tracking verified
- [ ] Lead capture form working

### Email
- [ ] Waitlist announcement ready
- [ ] Welcome sequence loaded
- [ ] Trial nurture sequence loaded
- [ ] Founder signature updated

---

## Launch Week Success Metrics

| Metric | Target | Stretch Goal |
|--------|--------|--------------|
| ProductHunt Rank | Top 5 | Top 3 |
| ProductHunt Upvotes | 100+ | 200+ |
| Website Visits | 5,000 | 10,000 |
| Email Signups | 200 | 500 |
| Trial Starts | 50 | 100 |
| Paying Customers | 15 | 30 |
| GitHub Stars | 100 | 200 |
| Discord Members | 50 | 100 |

**Post-Launch Debrief Questions**:
1. Which channel performed best?
2. What feedback surprised us?
3. What should we do differently next time?
4. What's the most-requested feature?
5. What's blocking conversions?
