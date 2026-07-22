import { blogArticles } from "@/lib/blog";

export type SeoLandingPage = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  heroTitle: string;
  heroDescription: string;
  whyTitle: string;
  whyParagraphs: string[];
  howItWorks: Array<{
    title: string;
    description: string;
  }>;
  studyNotes: {
    title: string;
    paragraphs: string[];
  };
  benefits: Array<{
    title: string;
    description: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const seoLandingPages = [
  {
    slug: "poker-hand-analyzer",
    title: "Poker Hand Analyzer",
    metaTitle: "Poker Hand Analyzer | AI Poker Hand Review by Kevixo",
    metaDescription:
      "Analyze poker hands with Kevixo, an AI poker hand analyzer that explains mistakes, better decisions, leaks, and practical homework.",
    category: "AI Poker Analysis",
    heroTitle: "Poker hand analysis that explains the decision, not just the result.",
    heroDescription:
      "Kevixo is an AI poker hand analyzer for players who want to understand the key decision in a hand and what decision should improve next.",
    whyTitle: "Why use an AI poker hand analyzer?",
    whyParagraphs: [
      "Most poker players remember the emotional part of a hand: the river card, the big call, or the moment an opponent showed a surprising hand. That memory is useful, but it is not enough for serious improvement. A poker hand analyzer gives the hand a structure. It separates the facts from the feeling, then studies positions, stack sizes, ranges, board texture, bet sizing, and final action.",
      "Kevixo is built for that review habit. You paste a complete hand history or start with a demo hand, and the product turns one spot into a practical coaching report. The goal is not to overwhelm you with solver language. The goal is to show the key lesson, the biggest mistake, the better decision, and the reasoning that connects them. That makes every review easier to remember during the next session.",
      "The best poker analysis also looks for patterns. One bad river call may be a close spot. Five river calls with the same problem become a leak. Kevixo connects poker hand analysis with leak detection, GTO-inspired range thinking, and personalized homework so the review becomes more than a one-time answer. It becomes a repeatable study loop.",
      "For beginner and intermediate players, the value is clarity. You may not know whether the problem was preflop, flop sizing, turn pressure, or a river bluff-catch. Kevixo narrows the hand to the decision that mattered most and explains it in plain language. That helps you build the habit of thinking in ranges and expected value instead of reacting only to the pot result.",
    ],
    howItWorks: [
      {
        title: "Paste or choose a hand",
        description:
          "Start with a complete Texas Hold'em hand history or use a built-in demo. The stronger the hand details, the more useful the analysis becomes.",
      },
      {
        title: "Get a coaching report",
        description:
          "Kevixo reviews the action and returns a key lesson, biggest mistake, better decision, evidence, leak, and short homework.",
      },
      {
        title: "Apply one improvement",
        description:
          "Use the checklist and homework to practice one repeatable decision, such as folding against polar river bets or choosing a better turn barrel.",
      },
    ],
    studyNotes: {
      title: "How to use analysis without becoming results-oriented",
      paragraphs: [
        "The most useful poker hand analysis begins before you know whether the pot was won. If you only review hands after a painful river, the review can become a search for blame. Kevixo is designed to make the process calmer. It asks what information existed at the decision point, what ranges were realistic, and what action would perform best over many similar hands. That shift matters because poker improvement depends on repeatable decisions, not emotional reactions to one showdown.",
        "When you read a Kevixo report, start with the key lesson rather than the grade. The grade is a signal, but the lesson tells you what to practice. A hand with a B grade may still contain a serious river leak if the earlier streets were good. A hand with a C grade may be close if the spot was genuinely difficult. Reading the reasoning first helps you avoid turning the review into a simple pass or fail.",
        "The better decision section is also important because it gives your future self a plan. Maybe the right adjustment is folding against a polar river size, checking a marginal showdown hand, or betting a turn that improves your range. The exact answer changes by hand, but the habit is stable: define the opponent range, understand the price, and choose an action with a clear purpose.",
        "A poker hand analyzer should make you more independent over time. After several reviews, you should begin to predict the main lesson before the report appears. That is the point of Kevixo. It is not just a tool for one answer. It is a training loop that helps you see which decisions deserve attention and which table habits are becoming more disciplined.",
      ],
    },
    benefits: [
      {
        title: "Clear decision review",
        description:
          "Understand which street mattered most and whether your action made sense against realistic ranges.",
      },
      {
        title: "Better range thinking",
        description:
          "Learn to compare your hand with both players' ranges instead of judging only by final showdown.",
      },
      {
        title: "Leak detection",
        description:
          "Spot patterns such as overcalling, passive draws, missed value, or bluffing without enough fold equity.",
      },
      {
        title: "Actionable homework",
        description:
          "Turn one reviewed hand into a five-minute study task that is easy to complete after a session.",
      },
      {
        title: "No solver required",
        description:
          "Get GTO-inspired coaching in readable language without needing to open a separate solver workflow.",
      },
      {
        title: "Fast feedback loop",
        description:
          "Review a hand while the session is still fresh, when your thought process is easiest to remember.",
      },
    ],
    faqs: [
      {
        question: "What is a poker hand analyzer?",
        answer:
          "A poker hand analyzer reviews a completed hand and explains the decisions inside it. Kevixo focuses on the key lesson, biggest mistake, better line, leak, and homework rather than only summarizing the result.",
      },
      {
        question: "Can Kevixo analyze any poker hand?",
        answer:
          "Kevixo works best with complete No Limit Texas Hold'em hand histories that include positions, stacks, blinds, hole cards, board cards, betting actions, and bet sizes.",
      },
      {
        question: "Does Kevixo replace a poker solver?",
        answer:
          "No. Kevixo is a coaching layer for practical review. It uses GTO-inspired concepts, but it is designed to explain decisions clearly rather than replace solver study.",
      },
      {
        question: "Is the analysis useful for beginners?",
        answer:
          "Yes. Kevixo is written for beginner and intermediate players who want plain-language coaching around ranges, bet sizing, leaks, and next steps.",
      },
      {
        question: "Do I need to create an account?",
        answer:
          "No account is required for the current review flow. You can try a demo hand or paste a hand history and see how the coaching report works.",
      },
      {
        question: "What should I review first?",
        answer:
          "Start with a hand where you felt uncertain or lost a meaningful pot. The best reviews usually come from hands with a close decision, not from obvious coolers.",
      },
    ],
  },
  {
    slug: "hand-history-review",
    title: "Hand History Review",
    metaTitle: "Hand History Review | AI Poker Coaching for Hand Histories",
    metaDescription:
      "Review poker hand histories with Kevixo and turn raw hand text into AI coaching, leak detection, and practical decision homework.",
    category: "Hand History Study",
    heroTitle: "Turn a poker hand history into a coaching session.",
    heroDescription:
      "Kevixo helps you review hand histories with structured AI feedback, so every saved hand becomes a clearer lesson.",
    whyTitle: "Why hand history review matters",
    whyParagraphs: [
      "A hand history is more than a record of who won the pot. It is the most reliable way to study a poker decision after the session ends. Memory often removes the details that matter: the exact stack depth, the preflop action, the size of a turn bet, or which player had position. A full hand history keeps those details intact so the review can be honest.",
      "Kevixo turns that raw hand history into a readable coaching report. Instead of asking a vague question like whether top pair was good, you get a structured breakdown of the key lesson, better decision, evidence, leak, and homework. The hand history remains the source of truth, but the output becomes easier to study and apply.",
      "Good hand history review also helps you avoid results-oriented thinking. If the pot went your way, your decision may still have been thin. If the pot went against you, your decision may still have been sound. Kevixo pushes the review back toward ranges, bet sizing, board texture, and expected value. That is where real improvement happens.",
      "For players building a study routine, reviewing one hand history at a time is realistic. You do not need a huge database to start learning. Pick one hand, understand the turning point, write down the lesson, and repeat after the next session. Over time, those reviews reveal personal patterns that are difficult to see in the moment.",
    ],
    howItWorks: [
      {
        title: "Collect the full hand",
        description:
          "Use a hand history with seats, stacks, blinds, hole cards, streets, actions, bet sizes, and final action.",
      },
      {
        title: "Let Kevixo structure the review",
        description:
          "The report highlights the key decision, what went wrong, what line was better, and why the evidence points that way.",
      },
      {
        title: "Save the lesson",
        description:
          "Use the checklist and homework to turn one hand history into a specific behavior to practice next session.",
      },
    ],
    studyNotes: {
      title: "How to prepare a hand history for a better review",
      paragraphs: [
        "A good hand history review starts with clean input. Before submitting a hand, check that the important facts are included. The review needs to know who posted the blinds, how deep the stacks were, what Hero held, which players entered preflop, what the board cards were, and how large each bet was. If one of those details is missing, the coach has to infer too much, and the lesson becomes less precise.",
        "It is also helpful to choose hands that contain a real decision. A cooler can be emotionally memorable but strategically simple. A small pot with an uncertain turn check may teach more than a huge all-in where both ranges were forced. Kevixo is strongest when the hand has a meaningful choice, such as whether to continuation bet, whether to barrel a draw, whether to value bet thinly, or whether to bluff-catch a large river bet.",
        "When you study the output, compare the report to your in-game thought process. Did you think about the same range? Did you notice the same blocker? Did you understand the bet size as a fraction of the pot? This comparison is where learning happens. The goal is not only to know the better line after the hand. The goal is to recognize the same pattern while playing.",
        "Over time, hand history review becomes a personal database of decisions. You may notice that the hands you submit are not random. They cluster around uncomfortable spots: rivers, three-bet pots, paired boards, or missed value. That clustering is useful. It tells you what part of your game wants attention before the results make the problem more expensive.",
        "Another benefit is accountability. A hand history forces the review to respect what actually happened, not what the hand felt like afterward. If the pot was small on the turn, the river bet may not be as scary as it seemed. If the stacks were shallow, a call that looked loose may have been closer. Kevixo uses those concrete details to keep the lesson grounded in the real hand.",
        "That grounded approach makes the review easier to trust. You can disagree with a recommendation, but you can still see which facts produced it. That gives you a better conversation with your own strategy and a cleaner way to compare future hands.",
      ],
    },
    benefits: [
      {
        title: "Complete context",
        description:
          "Hand histories preserve the details needed for accurate review, including position, stacks, streets, and sizing.",
      },
      {
        title: "Less emotional review",
        description:
          "Study the decision process instead of only reacting to the river card or showdown result.",
      },
      {
        title: "Personal leak tracking",
        description:
          "Repeated reviews make it easier to notice if the same mistake appears across several sessions.",
      },
      {
        title: "Better post-session routine",
        description:
          "Review one hand while the session is fresh and turn it into a study note before details fade.",
      },
      {
        title: "Beginner-friendly coaching",
        description:
          "Kevixo explains range and EV concepts in language designed for players still building their review process.",
      },
    ],
    faqs: [
      {
        question: "What should a hand history include?",
        answer:
          "A useful hand history should include seats, stack sizes, blinds, Hero hole cards, preflop action, flop, turn, river, bet sizes, and final action or showdown.",
      },
      {
        question: "Can I paste only part of a hand?",
        answer:
          "Partial hands are harder to review accurately. Kevixo works best when the complete sequence is included, because early action changes later decisions.",
      },
      {
        question: "Does Kevixo support screenshot uploads?",
        answer:
          "Screenshot upload is planned as a future input method. The current review flow focuses on text hand histories and built-in demo hands.",
      },
      {
        question: "Why does position matter in a hand history?",
        answer:
          "Position changes ranges, initiative, and postflop options. The same hand can be strong or weak depending on who acted first and who has range advantage.",
      },
      {
        question: "Can a hand history reveal leaks?",
        answer:
          "Yes. One hand can show a decision mistake, and multiple reviewed histories can reveal patterns such as overcalling, missed value, or passive turn play.",
      },
      {
        question: "How often should I review hand histories?",
        answer:
          "Start with one meaningful hand after each session. Consistency matters more than volume when building a study habit.",
      },
    ],
  },
  {
    slug: "poker-review-tool",
    title: "Poker Review Tool",
    metaTitle: "Poker Review Tool | Review Poker Decisions with Kevixo",
    metaDescription:
      "Use Kevixo as a poker review tool to study decisions, find leaks, improve sessions, and get AI-powered coaching reports.",
    category: "Poker Study Tool",
    heroTitle: "A poker review tool built for one clear decision at a time.",
    heroDescription:
      "Kevixo gives poker players a focused way to review hands, understand mistakes, and leave each session with a practical improvement task.",
    whyTitle: "Why a focused poker review tool works",
    whyParagraphs: [
      "Many poker tools are powerful but heavy. They ask you to import databases, configure filters, study charts, or already know which spot you want to solve. That can be valuable for advanced study, but it creates friction for players who simply want to understand one difficult hand. Kevixo is intentionally focused on the single-hand review experience.",
      "A good poker review tool should help you answer three questions. What was the most important decision? What would a better line look like? What should I practice next? Kevixo organizes the answer into coaching sections that are easy to scan after a session. The result is a report you can use immediately instead of a pile of raw data.",
      "This focus makes review more sustainable. If studying poker feels like a huge project, it is easy to skip. If the review is one hand, one leak, and one short homework task, it becomes part of the session routine. Over weeks, that small review loop can produce a much clearer picture of your decision patterns.",
      "Kevixo is especially useful for players who want more structure but do not want to become dependent on memorized outputs. The tool explains the reasoning behind a better decision. It uses range thinking, bet sizing logic, GTO-inspired concepts, and practical language so you can carry the lesson back to the table.",
    ],
    howItWorks: [
      {
        title: "Choose a meaningful spot",
        description:
          "Pick a hand with uncertainty, a big pot, a river decision, a missed value bet, or a line that felt uncomfortable.",
      },
      {
        title: "Review the coaching report",
        description:
          "Read the key lesson, biggest mistake, better decision, evidence, checklist, and coach note.",
      },
      {
        title: "Practice the next trigger",
        description:
          "Use Kevixo's homework to recognize the same type of decision in your next session.",
      },
    ],
    studyNotes: {
      title: "How to build a review habit that actually lasts",
      paragraphs: [
        "A poker review tool only helps if the workflow is easy enough to repeat. Many players start with ambitious study plans and then stop after a few sessions because the routine is too heavy. Kevixo is designed around a smaller habit: review one meaningful hand, understand one mistake, and leave with one homework task. That is enough to create progress without making study feel like a second job.",
        "The best time to review is soon after the session, while your memory of the decision is still alive. You may remember why you called, what you thought villain represented, or why you chose a certain bet size. Those details are not always visible in the hand history, but they help you compare your thought process to the coaching report. This makes the review more personal and more useful.",
        "A good review tool should also reduce friction for first-time users. That is why Kevixo includes demo hands and avoids requiring a poker account before someone can experience the report. If a player can see the output quickly, they can judge whether the coaching style helps. The product should sell the learning experience, not force users to prepare a perfect setup before they understand the value.",
        "For ongoing study, treat each report like a note from a coach. Save the key lesson, especially if it describes a spot you expect to see again. The goal is not to collect hundreds of reports. The goal is to make your next decision slightly clearer. When a similar hand appears, the previous review should give you a mental checkpoint before you click call, bet, or fold.",
        "This is why a lightweight review tool can be more useful than a complicated system for many players. The report gives enough structure to learn without asking you to manage a full study operation. If you can review one hand, understand one mistake, and practice one adjustment, you have a routine that can survive busy weeks and still move your game forward.",
        "Kevixo keeps that routine visible. The page encourages a single next action, not an endless list of study tasks. For players who want consistency, that constraint is a feature because it makes improvement easier to restart after every session.",
      ],
    },
    benefits: [
      {
        title: "Fast review workflow",
        description:
          "Move from raw hand history to coaching report without building a complex database first.",
      },
      {
        title: "Decision-first layout",
        description:
          "The report focuses on the action that mattered most rather than listing every street with equal weight.",
      },
      {
        title: "Useful for study notes",
        description:
          "Each review creates a concise lesson, leak, and homework task that can become part of your study journal.",
      },
      {
        title: "Works with demo hands",
        description:
          "New players can test the product instantly using built-in demo hands before importing their own histories.",
      },
      {
        title: "Practical AI coaching",
        description:
          "Kevixo explains poker concepts in a coaching tone, not in a dense technical output.",
      },
    ],
    faqs: [
      {
        question: "What makes Kevixo different from a tracker?",
        answer:
          "Trackers organize large volumes of data. Kevixo focuses on turning one hand into a practical coaching report with a lesson, leak, and homework.",
      },
      {
        question: "Is this tool for cash games or tournaments?",
        answer:
          "The current review experience is best suited to No Limit Texas Hold'em hand histories. The same decision review principles can help many formats, but complete context is important.",
      },
      {
        question: "Can I use Kevixo after every session?",
        answer:
          "Yes. Reviewing one meaningful hand after each session is one of the best ways to build a repeatable improvement habit.",
      },
      {
        question: "Does Kevixo show raw JSON?",
        answer:
          "No. The product renders coaching cards and readable sections so the output feels like a report, not a developer tool.",
      },
      {
        question: "Does the review include homework?",
        answer:
          "Yes. Kevixo includes short homework designed to take no more than a few minutes and reinforce the main lesson.",
      },
      {
        question: "Do I need poker software experience?",
        answer:
          "No. You can start with a demo hand or paste a complete hand history. The page is built for a simple first-time experience.",
      },
    ],
  },
  {
    slug: "gto-poker-coach",
    title: "GTO Poker Coach",
    metaTitle: "GTO Poker Coach | Practical AI Coaching for Poker Decisions",
    metaDescription:
      "Use Kevixo as a GTO-inspired poker coach that explains ranges, bet sizing, leaks, and better decisions in plain language.",
    category: "GTO-inspired Coaching",
    heroTitle: "GTO-inspired poker coaching without solver overload.",
    heroDescription:
      "Kevixo helps players learn range thinking, EV logic, and better decisions through practical AI hand reviews.",
    whyTitle: "Why GTO ideas need practical coaching",
    whyParagraphs: [
      "GTO poker can feel intimidating because many players first meet it through charts, solver trees, and abstract frequencies. Those tools are useful, but they do not automatically teach you how to think during a real hand. A practical GTO poker coach should translate the ideas into decisions: which range has advantage, what size makes sense, what hands call, and which bluffs are believable.",
      "Kevixo is built around that translation. It does not try to replace a solver or claim every output is a perfect equilibrium solution. Instead, it uses GTO-inspired thinking to explain why one line is more disciplined than another. The report points to range interaction, blockers, pot odds, board texture, and value-to-bluff balance in language that is easier to apply.",
      "This matters because most players do not struggle from lacking a memorized chart in every node. They struggle because they call without naming bluffs, bet without a purpose, miss thin value, or choose sizes that do not match the range story. Kevixo helps identify those mistakes and connect them to a better decision process.",
      "A GTO-inspired coach is most useful when it changes your next action. If the lesson is river bluff-catching, the next-time checklist might ask you to name value hands, list natural bluffs, and fold if the bluff list is too short. That is a practical bridge between theory and table behavior.",
    ],
    howItWorks: [
      {
        title: "Start with the real hand",
        description:
          "Kevixo reviews your actual hand history, not a generic chart, so the coaching is tied to the spot you played.",
      },
      {
        title: "Translate theory into reasoning",
        description:
          "The report explains range advantage, sizing, blockers, and EV concepts in a way that supports the better line.",
      },
      {
        title: "Practice a table-ready rule",
        description:
          "The checklist turns theory into a repeatable trigger you can use during future hands.",
      },
    ],
    studyNotes: {
      title: "How to turn GTO ideas into table decisions",
      paragraphs: [
        "GTO language becomes valuable when it changes a real decision. A player does not need to recite a full solver tree to improve. They need to understand whether a range has enough strong hands, whether a bet size creates pressure, whether a blocker matters, and whether a call has enough bluff evidence. Kevixo uses these ideas as coaching tools rather than as abstract theory.",
        "For example, a river bluff-catch is not solved by saying you have top pair. The better question is whether the opponent arrives with enough missed draws or overplayed value hands for the call to perform well. That is a GTO-inspired question because it compares range composition and price, but the practical output is simple: call only when the bluff evidence is strong enough.",
        "The same approach applies to betting. A good bet should have a reason. It may get value from worse hands, deny equity to overcards, fold out better hands, or set up a river. If the hand review cannot name that reason, the bet may be more emotional than strategic. Kevixo makes that purpose visible so players can stop clicking buttons out of habit.",
        "The best coaching connects theory to memory. If the report tells you to list value hands before bluff-catching, that is a table-ready rule. If it tells you to choose turn barrels with equity and blockers, that is another rule. Over time, these rules help you develop GTO-informed instincts without needing to study every possible branch before you can improve.",
        "Kevixo also helps players understand when theory should make them more patient. GTO-inspired study is not only about finding aggressive bluffs. Sometimes the best lesson is that a hand wants to check, realize equity, or fold because the range story is poor. That kind of discipline is difficult to learn from results alone, but it becomes clearer when the review explains the incentives behind each action.",
        "The result is a calmer way to study theory. Instead of trying to memorize every solver branch, you can focus on one spot and ask which strategic idea matters most. That makes GTO thinking feel usable rather than distant.",
        "For many players, that is the missing bridge. They have heard about balance, ranges, and equilibrium, but they need help connecting those words to a river fold or a turn bet. Kevixo keeps the theory attached to the hand, which makes the lesson easier to remember.",
      ],
    },
    benefits: [
      {
        title: "Plain-language GTO concepts",
        description:
          "Learn ideas like range advantage and polarized sizing through hands you actually played.",
      },
      {
        title: "Better bluff-catching discipline",
        description:
          "Review river calls by comparing value hands, natural bluffs, blockers, and price.",
      },
      {
        title: "More purposeful sizing",
        description:
          "Understand whether a bet targets worse calls, folds out better hands, denies equity, or sets up a later street.",
      },
      {
        title: "No solver setup",
        description:
          "Get a practical coaching report without building a game tree or selecting abstractions.",
      },
      {
        title: "Homework that sticks",
        description:
          "Each review ends with a small task that turns the theory into a habit.",
      },
    ],
    faqs: [
      {
        question: "Is Kevixo a GTO solver?",
        answer:
          "No. Kevixo is a GTO-inspired coaching tool. It explains decisions using range and EV concepts, but it is not a solver replacement.",
      },
      {
        question: "Can beginners use GTO-inspired coaching?",
        answer:
          "Yes. Kevixo keeps the language practical and focuses on decisions like betting, calling, folding, and reviewing bluff evidence.",
      },
      {
        question: "Will Kevixo give exact frequencies?",
        answer:
          "Kevixo focuses on coaching explanations and practical improvements, not exact solver frequency tables.",
      },
      {
        question: "How does this help my sessions?",
        answer:
          "It turns a confusing hand into a table-ready lesson, such as when to fold river, when to value bet, or when a barrel needs more equity.",
      },
      {
        question: "Should I still study with solvers?",
        answer:
          "Advanced players may still use solvers. Kevixo is useful when you want fast, readable coaching tied to your own hand histories.",
      },
      {
        question: "What makes a review GTO-inspired?",
        answer:
          "The review considers range advantage, blockers, bet sizing, value-to-bluff logic, pot odds, and how the board changes both players' ranges.",
      },
    ],
  },
  {
    slug: "poker-leak-finder",
    title: "Poker Leak Finder",
    metaTitle: "Poker Leak Finder | Find Poker Mistakes with AI Review",
    metaDescription:
      "Find poker leaks with Kevixo by reviewing hands for repeated mistakes, river overcalls, missed value, weak barrels, and study homework.",
    category: "Leak Detection",
    heroTitle: "Find poker leaks before they become habits.",
    heroDescription:
      "Kevixo reviews individual hands, identifies likely leaks, and gives you a practical way to improve one recurring mistake at a time.",
    whyTitle: "Why leak finding starts with one hand",
    whyParagraphs: [
      "A poker leak is not just one bad result. It is a decision pattern that quietly repeats across many sessions. You may overcall rivers, avoid thin value, bluff turns without enough equity, or check back too many flops in position. These mistakes are hard to see while playing because each hand feels unique. A poker leak finder helps connect those decisions into patterns.",
      "Kevixo starts with a single hand because that is where the behavior is visible. The review identifies the biggest mistake, the likely leak, and the better decision. Then it gives a short homework task so the next session has a clear focus. Over time, multiple reviews can reveal whether the same leak keeps appearing.",
      "Leak detection is most useful when it is specific. Telling a player to play better postflop is too vague. Telling a player that they overcall large river bets without naming enough bluffs is actionable. Kevixo aims for that level of coaching. The report gives you a leak label, evidence from the hand, and a checklist for the next time the spot appears.",
      "This is especially helpful for players who study but still feel stuck. You may know many concepts yet still repeat the same high-cost decisions under pressure. Kevixo narrows the improvement target so you can practice the exact trigger that matters: a turn barrel, a river fold, a value bet, or a preflop range discipline issue.",
    ],
    howItWorks: [
      {
        title: "Review a costly or uncertain hand",
        description:
          "Choose a hand where the decision felt close, emotional, expensive, or confusing.",
      },
      {
        title: "Find the likely leak",
        description:
          "Kevixo identifies the mistake pattern behind the hand and explains why it matters for future sessions.",
      },
      {
        title: "Use the homework loop",
        description:
          "Practice a short task designed to make the leak easier to recognize next time.",
      },
    ],
    studyNotes: {
      title: "How to recognize a leak before it gets expensive",
      paragraphs: [
        "Leaks are difficult because they often feel reasonable in the moment. Calling one river bet with a decent pair can feel standard. Checking back a thin value spot can feel safe. Giving up on a turn bluff can feel disciplined. The problem appears when the same safe-feeling decision repeats across many hands and quietly lowers your win rate. Kevixo helps bring those patterns into view.",
        "A single review should not make you panic about your whole game. Instead, treat it as a clue. If the report says the biggest mistake was overcalling a polar river bet, write that down and watch for similar spots. If the same leak appears again, the evidence becomes stronger. This is how a leak finder becomes useful without needing a massive sample on day one.",
        "The homework section is important because identifying a leak is only half the job. You need a small action that changes behavior. For river overcalling, the homework might be naming three natural bluffs before calling. For missed value, it might be reviewing hands where worse pairs can call. The work is short, but it gives your next session a clear intention.",
        "Kevixo is built for that feedback loop. The report labels the likely leak, explains the evidence, and points to the better decision. The founder dashboard and feedback system help improve the product, but the player value is simple: you can stop treating every mistake as random and start seeing the decision pattern that deserves practice.",
        "The best way to use a leak finder is to stay specific. Do not try to fix every weakness in one week. Choose the leak that appears most often or costs the most in large pots, then review several hands through that lens. If the same warning keeps appearing, you have found a study theme that can guide your next sessions more effectively than a vague promise to play tighter or focus harder.",
        "This also makes progress easier to notice. When a familiar spot appears and you pause before repeating the old mistake, the leak is already weakening. The improvement may be small, but it is exactly the kind of change that compounds.",
        "A good leak finder should make that moment visible. Kevixo gives the mistake a name, connects it to evidence, and turns it into a next-session checkpoint.",
      ],
    },
    benefits: [
      {
        title: "Specific leak labels",
        description:
          "See whether the hand points to overcalling, missed value, weak barreling, poor sizing, or passive draw play.",
      },
      {
        title: "Evidence-based review",
        description:
          "Kevixo ties the leak to actions in the hand instead of giving a generic study tip.",
      },
      {
        title: "Better session focus",
        description:
          "Leave a review with one thing to watch for in your next session.",
      },
      {
        title: "Pattern building",
        description:
          "Repeated reviews can help you notice if the same leak appears across several hands.",
      },
      {
        title: "Beginner-friendly language",
        description:
          "The report explains leaks in practical poker terms without requiring advanced solver knowledge.",
      },
    ],
    faqs: [
      {
        question: "What is a poker leak?",
        answer:
          "A poker leak is a repeated decision mistake that costs expected value, such as overcalling rivers, missing value bets, or choosing poor bluff spots.",
      },
      {
        question: "Can one hand reveal a leak?",
        answer:
          "One hand can suggest a likely leak. Multiple reviews make the pattern stronger, especially when the same mistake appears in similar spots.",
      },
      {
        question: "What leaks can Kevixo find?",
        answer:
          "Kevixo can identify likely issues such as river overcalling, missed continuation bets, weak turn barrels, passive draws, and thin value hesitation.",
      },
      {
        question: "Does leak detection require tracking software?",
        answer:
          "No. Tracking software can be useful, but Kevixo starts with individual hand histories and turns them into coaching reports.",
      },
      {
        question: "How do I fix a poker leak?",
        answer:
          "Start with one repeatable trigger. Kevixo gives a checklist and homework so you can practice the better decision in future sessions.",
      },
      {
        question: "Is leak detection useful for experienced players?",
        answer:
          "Yes. Even experienced players can miss value through repeated small mistakes, especially in river decisions, bet sizing, and missed value spots.",
      },
    ],
  },
] satisfies SeoLandingPage[];

export const seoLandingSlugs = seoLandingPages.map((page) => page.slug);

export function getSeoLandingPage(slug: string) {
  return seoLandingPages.find((page) => page.slug === slug) ?? null;
}

export function getSeoLandingPageUrl(slug: string) {
  return `https://www.kevixo.com/${slug}`;
}

export function getRelatedArticles() {
  return blogArticles.slice(0, 3);
}
