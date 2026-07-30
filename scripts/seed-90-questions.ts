import { prisma } from '@starter-kit/database';

const db = prisma as any;

async function main() {
  console.log('🚀 Seeding Bank Soal EPTUNU (30 Listening, 30 Structure, 30 Reading = 90 Soal)...');

  // 1. Seed Audio File Placeholder
  const audioSample = '/api/v1/questions/audio/listening_sample.mp3';

  // ==========================================
  // SECTION 1: LISTENING COMPREHENSION (30 SOAL)
  // ==========================================
  console.log('📌 Seeding 30 Soal Listening Comprehension...');
  const listeningQuestionsData = [
    // PART A: Short Conversations (1 - 20)
    {
      listeningPart: 'PART_A',
      questionText: 'Man: Did you hear that Professor Adams postponed the term paper deadline?\nWoman: Did he? That is a real weight off my shoulders!',
      options: [
        { id: 'A', text: 'She is relieved about the extended deadline.' },
        { id: 'B', text: 'She thinks the paper is too heavy.' },
        { id: 'C', text: 'She already submitted her paper.' },
        { id: 'D', text: 'She disagrees with Professor Adams.' }
      ],
      correctOption: 'A',
      skillTag: 'Idioms & Implied Meaning',
      explanation: 'The idiom "a weight off my shoulders" means feeling relieved about a burden being removed.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: Are you going to the campus auditorium for the guest lecture tonight?\nMan: I would, but I have to finish my chemistry lab report.',
      options: [
        { id: 'A', text: 'He will attend the lecture later.' },
        { id: 'B', text: 'He has to study chemistry in the auditorium.' },
        { id: 'C', text: 'He is unable to attend due to an assignment.' },
        { id: 'D', text: 'He is presenting his chemistry report.' }
      ],
      correctOption: 'C',
      skillTag: 'Conditional & Implied Negative',
      explanation: '"I would, but..." indicates a polite refusal because of a prior commitment.',
      difficulty: 'MEDIUM',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Man: I can hardly believe how crowded the main library is today.\nWoman: Tell me about it! I spent twenty minutes looking for an empty desk.',
      options: [
        { id: 'A', text: 'She wants the man to describe the library.' },
        { id: 'B', text: 'She agrees that the library is extremely busy.' },
        { id: 'C', text: 'She left her desk unattended for twenty minutes.' },
        { id: 'D', text: 'She recommends going to another library.' }
      ],
      correctOption: 'B',
      skillTag: 'Agreement Expressions',
      explanation: '"Tell me about it!" is a common colloquial expression used to show strong agreement.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: Should we take the campus shuttle or walk to the science hall?\nMan: Walking takes fifteen minutes, but the shuttle isn\'t due for another half hour.',
      options: [
        { id: 'A', text: 'Take the shuttle to save energy.' },
        { id: 'B', text: 'Walk to the science hall instead of waiting.' },
        { id: 'C', text: 'Wait for thirty minutes at the station.' },
        { id: 'D', text: 'Cancel their visit to the science hall.' }
      ],
      correctOption: 'B',
      skillTag: 'Comparison & Decision Making',
      explanation: 'Walking (15 min) is faster than waiting 30 minutes for the shuttle, so walking is preferred.',
      difficulty: 'MEDIUM',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Man: Did Sarah manage to register for the advanced microeconomics course?\nWoman: Barely. She got the very last seat available.',
      options: [
        { id: 'A', text: 'Sarah failed to register for the course.' },
        { id: 'B', text: 'Sarah was the first person to register.' },
        { id: 'C', text: 'Sarah secured the final spot in the class.' },
        { id: 'D', text: 'Sarah decided to change her major.' }
      ],
      correctOption: 'C',
      skillTag: 'Almost Negative Expressions',
      explanation: '"Barely" indicates that she succeeded, but only just barely by taking the last seat.',
      difficulty: 'MEDIUM',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: The printer in the computer lab is out of toner again.\nMan: You should check the copy room on the second floor; they just re-stocked.',
      options: [
        { id: 'A', text: 'Buy new toner from the bookstore.' },
        { id: 'B', text: 'Use the printer in the second-floor copy room.' },
        { id: 'C', text: 'Wait for the lab technician to repair the printer.' },
        { id: 'D', text: 'Print the document at home.' }
      ],
      correctOption: 'B',
      skillTag: 'Suggestions & Recommendations',
      explanation: 'The man suggests going to the second-floor copy room where supplies are fresh.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Man: The weather forecast calls for heavy rain all afternoon.\nWoman: If I were you, I\'d grab an umbrella before heading out.',
      options: [
        { id: 'A', text: 'The woman wants to borrow an umbrella.' },
        { id: 'B', text: 'The man should take an umbrella with him.' },
        { id: 'C', text: 'The rain will clear up shortly.' },
        { id: 'D', text: 'They should postpone their trip tomorrow.' }
      ],
      correctOption: 'B',
      skillTag: 'Conditional Advice',
      explanation: '"If I were you, I\'d..." expresses direct advice to take an umbrella.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: Is the cafeteria still serving breakfast at ten o\'clock?\nMan: Only until ten-thirty, so you\'d better hurry.',
      options: [
        { id: 'A', text: 'Breakfast ended at ten o\'clock.' },
        { id: 'B', text: 'She has thirty minutes left to get breakfast.' },
        { id: 'C', text: 'The cafeteria is closed for renovations.' },
        { id: 'D', text: 'Lunch starts serving immediately.' }
      ],
      correctOption: 'B',
      skillTag: 'Time & Numerical Inference',
      explanation: 'Since it is 10:00 and breakfast stops at 10:30, she has half an hour.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Man: I am having trouble understanding the concept of opportunity cost.\nWoman: Why don\'t we ask Professor Lee during her office hours tomorrow?',
      options: [
        { id: 'A', text: 'Consult Professor Lee for clarification.' },
        { id: 'B', text: 'Skip the economics lecture tomorrow.' },
        { id: 'C', text: 'Search for the answer online.' },
        { id: 'D', text: 'Drop the economics course.' }
      ],
      correctOption: 'A',
      skillTag: 'Suggestions',
      explanation: '"Why don\'t we ask..." is a suggestion to meet the professor for help.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: Mark didn\'t show up for the study group session this afternoon.\nMan: He had to take his roommate to the urgent care clinic.',
      options: [
        { id: 'A', text: 'Mark forgot about the study group.' },
        { id: 'B', text: 'Mark was assisting a sick roommate.' },
        { id: 'C', text: 'Mark is an urgent care doctor.' },
        { id: 'D', text: 'Mark was studying at the clinic.' }
      ],
      correctOption: 'B',
      skillTag: 'Reason & Cause',
      explanation: 'Mark missed the session because he had to accompany his roommate to the clinic.',
      difficulty: 'MEDIUM',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Man: How did your presentation on renewable energy go?\nWoman: I couldn\'t have asked for a better response from the audience.',
      options: [
        { id: 'A', text: 'The audience had no questions.' },
        { id: 'B', text: 'The presentation was extremely successful.' },
        { id: 'C', text: 'She wished the audience was larger.' },
        { id: 'D', text: 'She had to cancel the presentation.' }
      ],
      correctOption: 'B',
      skillTag: 'Negative Expressions with Superlatives',
      explanation: '"Couldn\'t have asked for a better response" means it went exceptionally well.',
      difficulty: 'HARD',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: Did you buy the textbook for European History?\nMan: I managed to find a used copy at half the original price.',
      options: [
        { id: 'A', text: 'He bought a discounted second-hand textbook.' },
        { id: 'B', text: 'He borrowed the book from the library.' },
        { id: 'C', text: 'The book was sold out at the bookstore.' },
        { id: 'D', text: 'He decided not to buy the textbook.' }
      ],
      correctOption: 'A',
      skillTag: 'Synonyms & Details',
      explanation: '"Used copy at half price" corresponds to a discounted second-hand textbook.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Man: I\'m exhausted after working on the biology project all night.\nWoman: You look like you could use a strong cup of coffee.',
      options: [
        { id: 'A', text: 'The man looks well rested.' },
        { id: 'B', text: 'The woman offers to complete the project.' },
        { id: 'C', text: 'The man appears tired and needs caffeine.' },
        { id: 'D', text: 'They should start the project tonight.' }
      ],
      correctOption: 'C',
      skillTag: 'Observation & Inference',
      explanation: '"You could use a strong cup of coffee" implies he appears visibly exhausted.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: Do you know if the art museum offers student discounts?\nMan: All university students get in free with a valid student ID card.',
      options: [
        { id: 'A', text: 'Students pay half price at the museum.' },
        { id: 'B', text: 'Admission is complimentary with student identification.' },
        { id: 'C', text: 'The museum is closed on weekends.' },
        { id: 'D', text: 'Student IDs are not accepted.' }
      ],
      correctOption: 'B',
      skillTag: 'Factual Details',
      explanation: '"Free with a valid student ID" means admission is complimentary with ID.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Man: I heard the university bus service route is changing next semester.\nWoman: That\'s right, it will now stop right in front of the student center.',
      options: [
        { id: 'A', text: 'The bus service is being canceled.' },
        { id: 'B', text: 'A new bus stop will be added at the student center.' },
        { id: 'C', text: 'Students must pay higher bus fares.' },
        { id: 'D', text: 'The route will bypass the campus.' }
      ],
      correctOption: 'B',
      skillTag: 'Factual Details',
      explanation: 'The new route will stop right in front of the student center.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: The air conditioning in the dormitory lounge is broken.\nMan: No wonder it feels like an oven in here!',
      options: [
        { id: 'A', text: 'He is baking something in the oven.' },
        { id: 'B', text: 'He agrees that the room is uncomfortably hot.' },
        { id: 'C', text: 'He turned off the air conditioning.' },
        { id: 'D', text: 'He wants to fix the air conditioner himself.' }
      ],
      correctOption: 'B',
      skillTag: 'Similes & Idiomatic Exclamations',
      explanation: '"Feels like an oven" is a simile for an extremely hot room environment.',
      difficulty: 'MEDIUM',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Man: Should I submit my grant application online or in person?\nWoman: Either way is fine, as long as it arrives before five o\'clock today.',
      options: [
        { id: 'A', text: 'Online submission is mandatory.' },
        { id: 'B', text: 'Both methods are acceptable before the deadline.' },
        { id: 'C', text: 'The deadline has been extended until tomorrow.' },
        { id: 'D', text: 'He must deliver it in person.' }
      ],
      correctOption: 'B',
      skillTag: 'Conditions & Requirements',
      explanation: '"Either way is fine" means both online and in person are accepted if submitted on time.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: Did you manage to reserve a study room for our group project?\nMan: They were all booked, but the librarian let us use the conference room.',
      options: [
        { id: 'A', text: 'They could not find a place to study.' },
        { id: 'B', text: 'They were granted permission to use the conference room.' },
        { id: 'C', text: 'The librarian refused to help them.' },
        { id: 'D', text: 'They cancelled their group project.' }
      ],
      correctOption: 'B',
      skillTag: 'Inference',
      explanation: 'Although study rooms were full, they obtained the conference room instead.',
      difficulty: 'MEDIUM',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Man: I\'m thinking about taking six courses next semester.\nWoman: Don\'t you think you might be biting off more than you can chew?',
      options: [
        { id: 'A', text: 'She thinks six courses might be too overwhelming.' },
        { id: 'B', text: 'She recommends eating before class.' },
        { id: 'C', text: 'She encourages him to enroll in more classes.' },
        { id: 'D', text: 'She wants to take the same six courses.' }
      ],
      correctOption: 'A',
      skillTag: 'Idiom & Cautionary Advice',
      explanation: '"Biting off more than you can chew" means attempting a task that is too burdensome.',
      difficulty: 'HARD',
    },
    {
      listeningPart: 'PART_A',
      questionText: 'Woman: The university choir is holding auditions this Thursday evening.\nMan: I\'ve been practicing my vocal warm-ups all week just for this!',
      options: [
        { id: 'A', text: 'He plans to audition for the university choir.' },
        { id: 'B', text: 'He is attending a choir concert on Thursday.' },
        { id: 'C', text: 'He is teaching a vocal music class.' },
        { id: 'D', text: 'He missed the audition deadline.' }
      ],
      correctOption: 'A',
      skillTag: 'Intention & Action',
      explanation: 'Practicing all week for the audition demonstrates his clear intention to participate.',
      difficulty: 'EASY',
    },

    // PART B: Longer Conversations (21 - 25)
    {
      listeningPart: 'PART_B',
      questionText: 'Listen to a conversation between a student and a university academic advisor about course registration requirements.\nQuestion: What is the main purpose of the student\'s visit?',
      options: [
        { id: 'A', text: 'To change her major to Computer Science.' },
        { id: 'B', text: 'To request a waiver for a prerequisite course.' },
        { id: 'C', text: 'To apply for an internship position.' },
        { id: 'D', text: 'To drop a class before the deadline.' }
      ],
      correctOption: 'B',
      skillTag: 'Main Idea / Purpose',
      explanation: 'The student meets the advisor specifically to seek approval for waiving a prerequisite requirement.',
      difficulty: 'MEDIUM',
    },
    {
      listeningPart: 'PART_B',
      questionText: 'Question: Why does the student believe she is qualified for Advanced Data Structures?',
      options: [
        { id: 'A', text: 'She completed an equivalent online course during the summer.' },
        { id: 'B', text: 'She worked as a computer lab assistant.' },
        { id: 'C', text: 'She received a recommendation letter from her high school teacher.' },
        { id: 'D', text: 'She scored top marks in introductory calculus.' }
      ],
      correctOption: 'A',
      skillTag: 'Supporting Detail',
      explanation: 'The student explains that she mastered the prerequisite material through an accredited online summer program.',
      difficulty: 'MEDIUM',
    },
    {
      listeningPart: 'PART_B',
      questionText: 'Question: What document does the academic advisor request from the student?',
      options: [
        { id: 'A', text: 'An official university transcript and course syllabus.' },
        { id: 'B', text: 'A copy of her birth certificate.' },
        { id: 'C', text: 'A tuition payment receipt.' },
        { id: 'D', text: 'A written essay on data privacy.' }
      ],
      correctOption: 'A',
      skillTag: 'Factual Detail',
      explanation: 'The advisor needs to review the official syllabus and transcript to verify equivalent coursework.',
      difficulty: 'MEDIUM',
    },
    {
      listeningPart: 'PART_B',
      questionText: 'Question: When must the prerequisite waiver form be submitted?',
      options: [
        { id: 'A', text: 'By 5:00 PM this Friday.' },
        { id: 'B', text: 'At the end of the semester.' },
        { id: 'C', text: 'Before the midterm examination.' },
        { id: 'D', text: 'During graduation week.' }
      ],
      correctOption: 'A',
      skillTag: 'Time & Deadline Detail',
      explanation: 'The advisor specifies Friday at 5:00 PM as the strict registration deadline.',
      difficulty: 'EASY',
    },
    {
      listeningPart: 'PART_B',
      questionText: 'Question: What will the student probably do next?',
      options: [
        { id: 'A', text: 'Email the syllabus of her summer course to the advisor.' },
        { id: 'B', text: 'Go directly to the computer laboratory.' },
        { id: 'C', text: 'Withdraw from the university.' },
        { id: 'D', text: 'Purchase a new laptop computer.' }
      ],
      correctOption: 'A',
      skillTag: 'Inference of Next Action',
      explanation: 'Following the advisor\'s instructions, the student will immediately forward the required syllabus via email.',
      difficulty: 'MEDIUM',
    },

    // PART C: Academic Lectures (26 - 30)
    {
      listeningPart: 'PART_C',
      questionText: 'Listen to part of a lecture in an Environmental Science class regarding marine biology.\nQuestion: What is the primary focus of the professor\'s lecture?',
      options: [
        { id: 'A', text: 'The ecological role of coral reef bioluminescence.' },
        { id: 'B', text: 'The impact of ocean acidification on shellfish exoskeletons.' },
        { id: 'C', text: 'Commercial fishing techniques in deep seas.' },
        { id: 'D', text: 'The migration patterns of humpback whales.' }
      ],
      correctOption: 'B',
      skillTag: 'Lecture Main Idea',
      explanation: 'The professor introduces ocean acidification and its direct chemical impact on marine calcifying organisms.',
      difficulty: 'HARD',
    },
    {
      listeningPart: 'PART_C',
      questionText: 'Question: According to the professor, what causes ocean pH levels to drop?',
      options: [
        { id: 'A', text: 'Absorption of excess atmospheric carbon dioxide by seawater.' },
        { id: 'B', text: 'Industrial oil spills in coastal zones.' },
        { id: 'C', text: 'Thermal pollution from coastal power plants.' },
        { id: 'D', text: 'Increased rainfall during monsoon seasons.' }
      ],
      correctOption: 'A',
      skillTag: 'Scientific Cause & Effect',
      explanation: 'Atmospheric CO2 dissolves in seawater, forming carbonic acid which lowers ocean pH.',
      difficulty: 'HARD',
    },
    {
      listeningPart: 'PART_C',
      questionText: 'Question: How does acidic water specifically affect young marine organisms?',
      options: [
        { id: 'A', text: 'It depletes carbonate ions necessary for building calcium carbonate shells.' },
        { id: 'B', text: 'It increases water temperature beyond survival limits.' },
        { id: 'C', text: 'It prevents phytoplankton from conducting photosynthesis.' },
        { id: 'D', text: 'It alters the salinity of deep ocean currents.' }
      ],
      correctOption: 'A',
      skillTag: 'Detail / Process',
      explanation: 'Carbonic acid reacts with carbonate ions, leaving fewer ions available for shell formation.',
      difficulty: 'HARD',
    },
    {
      listeningPart: 'PART_C',
      questionText: 'Question: Why does the professor mention the pteropod sea butterfly?',
      options: [
        { id: 'A', text: 'To provide a real-world example of an organism vulnerable to dissolution.' },
        { id: 'B', text: 'To illustrate a successful species adaptation.' },
        { id: 'C', text: 'To compare freshwater and marine invertebrates.' },
        { id: 'D', text: 'To explain a food source for commercial salmon.' }
      ],
      correctOption: 'A',
      skillTag: 'Rhetorical Purpose',
      explanation: 'Pteropods are cited as a key indicator species whose shells visibly dissolve in acidic waters.',
      difficulty: 'HARD',
    },
    {
      listeningPart: 'PART_C',
      questionText: 'Question: What does the professor imply about future research in this field?',
      options: [
        { id: 'A', text: 'More interdisciplinary studies are required to mitigate ecosystem collapse.' },
        { id: 'B', text: 'Current research has already solved the acidification problem.' },
        { id: 'C', text: 'Marine organisms will naturally adapt within a few years.' },
        { id: 'D', text: 'Ocean acidification only affects localized polar regions.' }
      ],
      correctOption: 'A',
      skillTag: 'Inference / Conclusion',
      explanation: 'The professor emphasizes the urgent necessity for global collaborative research across chemistry and ecology.',
      difficulty: 'HARD',
    },
  ];

  for (let idx = 0; idx < listeningQuestionsData.length; idx++) {
    const q = listeningQuestionsData[idx];
    let status: 'APPROVED' | 'IN_REVIEW' | 'REJECTED' = 'APPROVED';
    let reviewNotes = null;

    if (idx >= 20 && idx < 27) {
      status = 'IN_REVIEW';
    } else if (idx >= 27) {
      status = 'REJECTED';
      reviewNotes = 'Harap perjelas opsi jawaban dan sertakan transkrip audio yang lebih mendetail.';
    }

    await db.question.create({
      data: {
        section: 'LISTENING',
        listeningPart: q.listeningPart,
        audioUrl: audioSample,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        skillTag: q.skillTag,
        difficulty: q.difficulty,
        status,
        reviewNotes,
      },
    });
  }
  console.log('✅ 30 Soal Listening Comprehension (dengan 7 IN_REVIEW & 3 REJECTED) berhasil di-seed!');

  // ==========================================
  // SECTION 2: STRUCTURE & WRITTEN EXPRESSION (30 SOAL)
  // ==========================================
  console.log('📌 Seeding 30 Soal Structure & Written Expression...');
  const structureQuestionsData = [
    // Part A: Structure (1 - 15)
    {
      questionText: 'The North Pole ________ a rigid land mass, but rather a thick layer of ice floating on the Arctic Ocean.',
      options: [
        { id: 'A', text: 'is not' },
        { id: 'B', text: 'that is not' },
        { id: 'C', text: 'which is not' },
        { id: 'D', text: 'not being' }
      ],
      correctOption: 'A',
      skillTag: 'Subject-Verb Structure',
      explanation: 'The sentence requires a main verb "is not" to complete the predicate after the subject "The North Pole".',
      difficulty: 'EASY',
    },
    {
      questionText: '________, the red giant star will eventually collapse under its own gravitational force.',
      options: [
        { id: 'A', text: 'Exhausting its nuclear fuel' },
        { id: 'B', text: 'Having exhausted its nuclear fuel' },
        { id: 'C', text: 'Fuel exhausted nuclear' },
        { id: 'D', text: 'Its nuclear fuel exhausts' }
      ],
      correctOption: 'B',
      skillTag: 'Participle Modifiers',
      explanation: 'A perfect participle clause "Having exhausted..." correctly modifies the subject following the comma.',
      difficulty: 'HARD',
    },
    {
      questionText: 'Rarely ________ such a dramatic climate shift occurred in such a short geological timeframe.',
      options: [
        { id: 'A', text: 'has' },
        { id: 'B', text: 'it has' },
        { id: 'C', text: 'have it' },
        { id: 'D', text: 'having' }
      ],
      correctOption: 'A',
      skillTag: 'Inversion after Negative Adverbs',
      explanation: 'Negative adverbs like "Rarely" placed at the beginning of a sentence trigger subject-auxiliary inversion ("has such a dramatic climate shift...").',
      difficulty: 'HARD',
    },
    {
      questionText: 'Dr. Jane Goodall, ________ pioneer in primatology, spent decades studying chimpanzee behavior in Tanzania.',
      options: [
        { id: 'A', text: 'was a' },
        { id: 'B', text: 'a' },
        { id: 'C', text: 'who a' },
        { id: 'D', text: 'she was a' }
      ],
      correctOption: 'B',
      skillTag: 'Appositives',
      explanation: 'An appositive noun phrase "a pioneer in primatology" renames the subject "Dr. Jane Goodall" without requiring a verb.',
      difficulty: 'EASY',
    },
    {
      questionText: 'Not until the invention of the electron microscope ________ to observe the internal structure of individual viruses.',
      options: [
        { id: 'A', text: 'scientists were able' },
        { id: 'B', text: 'were scientists able' },
        { id: 'C', text: 'ability of scientists' },
        { id: 'D', text: 'scientists being able' }
      ],
      correctOption: 'B',
      skillTag: 'Inversion with "Not Until"',
      explanation: 'Fronted negative adverbial phrases beginning with "Not until..." require inverted auxiliary verb order ("were scientists able").',
      difficulty: 'HARD',
    },
    {
      questionText: 'Photosynthesis is the process ________ green plants convert light energy into chemical energy stored in glucose.',
      options: [
        { id: 'A', text: 'by which' },
        { id: 'B', text: 'which by' },
        { id: 'C', text: 'in that' },
        { id: 'D', text: 'whereby it' }
      ],
      correctOption: 'A',
      skillTag: 'Relative Pronouns with Prepositions',
      explanation: '"By which" correctly connects the process noun with the clause describing how conversion occurs.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: '________ vast amounts of data quickly, modern supercomputers rely on parallel processing architectures.',
      options: [
        { id: 'A', text: 'To analyze' },
        { id: 'B', text: 'Analyzing' },
        { id: 'C', text: 'For analysis' },
        { id: 'D', text: 'Analyzed' }
      ],
      correctOption: 'A',
      skillTag: 'Infinitive of Purpose',
      explanation: 'An introductory infinitive clause "To analyze..." specifies the purpose of the main clause.',
      difficulty: 'EASY',
    },
    {
      questionText: 'Neither the department chair nor the faculty members ________ willing to compromise on the revised curriculum.',
      options: [
        { id: 'A', text: 'was' },
        { id: 'B', text: 'were' },
        { id: 'C', text: 'is' },
        { id: 'D', text: 'being' }
      ],
      correctOption: 'B',
      skillTag: 'Subject-Verb Agreement with "Neither/Nor"',
      explanation: 'With "Neither... nor...", the verb agrees with the closer subject noun ("faculty members", plural -> "were").',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'Had the weather conditions been more favorable, the space shuttle launch ________ as scheduled.',
      options: [
        { id: 'A', text: 'would proceed' },
        { id: 'B', text: 'would have proceeded' },
        { id: 'C', text: 'will have proceeded' },
        { id: 'D', text: 'proceeded' }
      ],
      correctOption: 'B',
      skillTag: 'Inverted Third Conditional',
      explanation: 'Inverted third conditional ("Had... been") requires "would have + past participle" in the main clause.',
      difficulty: 'HARD',
    },
    {
      questionText: 'The Great Wall of China, ________ over thousands of kilometers, was constructed to protect northern borders.',
      options: [
        { id: 'A', text: 'stretching' },
        { id: 'B', text: 'stretched' },
        { id: 'C', text: 'it stretches' },
        { id: 'D', text: 'whose stretch' }
      ],
      correctOption: 'A',
      skillTag: 'Reduced Relative Clauses (Active)',
      explanation: 'The present participle "stretching" replaces the active relative clause "which stretches".',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'It was during the Renaissance ________ scientific inquiry began to challenge traditional medieval dogma.',
      options: [
        { id: 'A', text: 'that' },
        { id: 'B', text: 'which' },
        { id: 'C', text: 'when' },
        { id: 'D', text: 'where' }
      ],
      correctOption: 'A',
      skillTag: 'Cleft Sentence Structure',
      explanation: 'It-cleft sentences use the pattern "It was [prepositional phrase] THAT [clause]".',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'The economic stimulus plan aims not only to reduce inflation ________ employment opportunities nationwide.',
      options: [
        { id: 'A', text: 'and also expand' },
        { id: 'B', text: 'but also to expand' },
        { id: 'C', text: 'or expanding' },
        { id: 'D', text: 'as well as expanding' }
      ],
      correctOption: 'B',
      skillTag: 'Correlative Conjunctions & Parallelism',
      explanation: '"Not only [to infinitive]... BUT ALSO [to infinitive]" maintains parallel grammatical form.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'Geologists estimate that the rock formations in the Grand Canyon are ________ two billion years old.',
      options: [
        { id: 'A', text: 'as many as' },
        { id: 'B', text: 'as much as' },
        { id: 'C', text: 'more old than' },
        { id: 'D', text: 'so much as' }
      ],
      correctOption: 'A',
      skillTag: 'Comparatives & Numerical Modifiers',
      explanation: '"As many as" is used before countable plural nouns/years to emphasize large quantities.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'Only after thorough laboratory testing ________ approved for general public distribution.',
      options: [
        { id: 'A', text: 'the new vaccine was' },
        { id: 'B', text: 'was the new vaccine' },
        { id: 'C', text: 'did the new vaccine' },
        { id: 'D', text: 'the new vaccine being' }
      ],
      correctOption: 'B',
      skillTag: 'Inversion after "Only After"',
      explanation: '"Only after..." at the start of a sentence requires inverted passive verb order ("was the new vaccine approved").',
      difficulty: 'HARD',
    },
    {
      questionText: 'The university library contains over two million volumes, ________ rare historical manuscripts.',
      options: [
        { id: 'A', text: 'including many' },
        { id: 'B', text: 'many include' },
        { id: 'C', text: 'which including' },
        { id: 'D', text: 'of which include' }
      ],
      correctOption: 'A',
      skillTag: 'Prepositional Participle Phrases',
      explanation: '"Including many" functions as a prepositional modifier to introduce examples.',
      difficulty: 'EASY',
    },

    // Part B: Written Expression / Error Identification (16 - 30)
    {
      questionText: 'The (A) rapid development of artificial intelligence (B) have caused significant debate among ethics (C) researchers and policy (D) makers worldwide.',
      options: [
        { id: 'A', text: 'rapid development' },
        { id: 'B', text: 'have caused' },
        { id: 'C', text: 'researchers' },
        { id: 'D', text: 'makers' }
      ],
      correctOption: 'B',
      skillTag: 'Subject-Verb Agreement Error',
      explanation: 'The singular subject "rapid development" requires the singular verb "has caused", not "have caused".',
      difficulty: 'EASY',
    },
    {
      questionText: 'Despite (A) their small size, hummingbirds are (B) capable to fly (C) backward and hover (D) in mid-air.',
      options: [
        { id: 'A', text: 'their' },
        { id: 'B', text: 'capable to fly' },
        { id: 'C', text: 'backward' },
        { id: 'D', text: 'in' }
      ],
      correctOption: 'B',
      skillTag: 'Adjective + Preposition Idiom Error',
      explanation: 'The adjective "capable" takes the preposition "of + gerund" ("capable of flying"), not an infinitive.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'Astronomers (A) use powerful telescopes for (B) observe distant galaxies and (C) calculate their cosmic (D) expansion rates.',
      options: [
        { id: 'A', text: 'use' },
        { id: 'B', text: 'observe' },
        { id: 'C', text: 'calculate' },
        { id: 'D', text: 'expansion' }
      ],
      correctOption: 'B',
      skillTag: 'Preposition + Gerund Error',
      explanation: 'Prepositions like "for" must be followed by a gerund ("for observing"), not a base verb.',
      difficulty: 'EASY',
    },
    {
      questionText: 'The Amazon Rainforest produces (A) approximately twenty percent of the (B) Earth oxygen supply through (C) continuous plant (D) photosynthesis.',
      options: [
        { id: 'A', text: 'approximately' },
        { id: 'B', text: 'Earth oxygen' },
        { id: 'C', text: 'continuous' },
        { id: 'D', text: 'photosynthesis' }
      ],
      correctOption: 'B',
      skillTag: 'Possessive Noun Error',
      explanation: 'The noun requires a possessive form ("Earth\'s oxygen supply").',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'Although (A) the two political candidates (B) disagreed on economic reform, (C) both of them agreed that education was (D) a top priority.',
      options: [
        { id: 'A', text: 'Although' },
        { id: 'B', text: 'disagreed' },
        { id: 'C', text: 'both of them' },
        { id: 'D', text: 'a top' }
      ],
      correctOption: 'C',
      skillTag: 'Redundancy Error',
      explanation: 'Using "both of them" after naming "the two political candidates" is redundant; simple "both" is required.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'The discovery of penicillin in 1928 (A) marked a major turning point in (B) medicine, allowing doctors (C) to treat effectively (D) bacterial infections.',
      options: [
        { id: 'A', text: 'marked' },
        { id: 'B', text: 'medicine' },
        { id: 'C', text: 'to treat effectively' },
        { id: 'D', text: 'bacterial' }
      ],
      correctOption: 'C',
      skillTag: 'Word Order / Adverb Placement',
      explanation: 'Adverbs should generally follow the object or precede the transitive verb ("to treat bacterial infections effectively").',
      difficulty: 'HARD',
    },
    {
      questionText: 'The human brain is (A) composed of (B) billions of neurons that (C) communicates with one another via (D) electrical impulses.',
      options: [
        { id: 'A', text: 'composed of' },
        { id: 'B', text: 'billions' },
        { id: 'C', text: 'communicates' },
        { id: 'D', text: 'electrical' }
      ],
      correctOption: 'C',
      skillTag: 'Relative Clause Verb Agreement',
      explanation: 'The relative pronoun "that" refers to plural "neurons", so the verb must be plural ("communicate").',
      difficulty: 'EASY',
    },
    {
      questionText: 'Solar panels generate (A) electricity by converting sunlight (B) direct into electrical current (C) using photovoltaic (D) silicon cells.',
      options: [
        { id: 'A', text: 'electricity' },
        { id: 'B', text: 'direct' },
        { id: 'C', text: 'using' },
        { id: 'D', text: 'silicon' }
      ],
      correctOption: 'B',
      skillTag: 'Adverb vs Adjective Usage',
      explanation: 'The action of converting requires the adverb "directly", not the adjective "direct".',
      difficulty: 'EASY',
    },
    {
      questionText: 'The committee recommended that the proposal (A) is revised before (B) being submitted to the (C) board of directors for (D) final approval.',
      options: [
        { id: 'A', text: 'is revised' },
        { id: 'B', text: 'being submitted' },
        { id: 'C', text: 'board' },
        { id: 'D', text: 'final' }
      ],
      correctOption: 'A',
      skillTag: 'Subjunctive Mood Error',
      explanation: 'Verbs like "recommended that..." require a subjunctive base form ("be revised"), not indicative "is revised".',
      difficulty: 'HARD',
    },
    {
      questionText: 'Electric vehicles are becoming (A) increasingly popular because they emit (B) fewer air pollutants than (C) traditional gasoline-powered (D) automobiles.',
      options: [
        { id: 'A', text: 'increasingly' },
        { id: 'B', text: 'fewer' },
        { id: 'C', text: 'traditional' },
        { id: 'D', text: 'automobiles' }
      ],
      correctOption: 'B',
      skillTag: 'Count vs Non-count Modifiers',
      explanation: "Fewer is used before countable plural nouns like pollutants.",
      difficulty: 'HARD',
    },
    {
      questionText: 'No (A) other mammal on Earth can dive (B) as deep or stay under water (C) as longer as the (D) sperm whale.',
      options: [
        { id: 'A', text: 'other' },
        { id: 'B', text: 'as deep' },
        { id: 'C', text: 'as longer as' },
        { id: 'D', text: 'sperm whale' }
      ],
      correctOption: 'C',
      skillTag: 'Equal Comparison Error',
      explanation: 'Equal comparisons use positive adjectives/adverbs "as long as", not comparative form "as longer as".',
      difficulty: 'EASY',
    },
    {
      questionText: 'Industrial revolution (A) brought profound economic changes, (B) transforming agricultural societies (C) into urban manufacturing (D) centers.',
      options: [
        { id: 'A', text: 'Industrial revolution' },
        { id: 'B', text: 'transforming' },
        { id: 'C', text: 'into' },
        { id: 'D', text: 'centers' }
      ],
      correctOption: 'A',
      skillTag: 'Article Omission Error',
      explanation: 'Specific historical eras require a definite article ("The Industrial Revolution").',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'Geneticists (A) have identified several genes (B) responsible for determining (C) how do organisms adapt to (D) extreme environmental conditions.',
      options: [
        { id: 'A', text: 'have identified' },
        { id: 'B', text: 'responsible for' },
        { id: 'C', text: 'how do organisms' },
        { id: 'D', text: 'extreme' }
      ],
      correctOption: 'C',
      skillTag: 'Indirect Question Word Order',
      explanation: 'Indirect clauses embedded in sentences use normal word order ("how organisms adapt"), not auxiliary inversion.',
      difficulty: 'HARD',
    },
    {
      questionText: 'The museum curator (A) carefully preserved the ancient papyrus (B) scroll, which had been (C) laying in a damp storage room for (D) decades.',
      options: [
        { id: 'A', text: 'carefully' },
        { id: 'B', text: 'scroll' },
        { id: 'C', text: 'laying' },
        { id: 'D', text: 'decades' }
      ],
      correctOption: 'C',
      skillTag: 'Lie vs Lay Confusion',
      explanation: 'Intransitive action of resting requires "lying", not transitive verb form "laying".',
      difficulty: 'HARD',
    },
    {
      questionText: 'Neither the professor (A) nor her research assistants (B) was aware that the laboratory equipment (C) had been recalibrated (D) yesterday.',
      options: [
        { id: 'A', text: 'nor' },
        { id: 'B', text: 'was aware' },
        { id: 'C', text: 'had been' },
        { id: 'D', text: 'yesterday' }
      ],
      correctOption: 'B',
      skillTag: 'Subject-Verb Agreement Error',
      explanation: 'The verb following "Neither... nor" agrees with plural subject "research assistants", so it must be "were aware".',
      difficulty: 'MEDIUM',
    },
  ];

  for (let idx = 0; idx < structureQuestionsData.length; idx++) {
    const q = structureQuestionsData[idx];
    let status: 'APPROVED' | 'IN_REVIEW' | 'REJECTED' = 'APPROVED';
    let reviewNotes = null;

    if (idx >= 22 && idx < 28) {
      status = 'IN_REVIEW';
    } else if (idx >= 28) {
      status = 'REJECTED';
      reviewNotes = 'Penjelasan tata bahasa kurang lengkap.';
    }

    await db.question.create({
      data: {
        section: 'STRUCTURE',
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        skillTag: q.skillTag,
        difficulty: q.difficulty,
        status,
        reviewNotes,
      },
    });
  }
  console.log('✅ 30 Soal Structure & Written Expression (dengan 6 IN_REVIEW & 2 REJECTED) berhasil di-seed!');

  // ==========================================
  // SECTION 3: READING COMPREHENSION (30 SOAL)
  // ==========================================
  console.log('📌 Seeding 30 Soal Reading Comprehension (3 Reading Passages)...');

  // PASSAGE 1
  const passage1 = await db.passage.create({
    data: {
      title: 'The Serayu River Basin & Ecological Evolution of Central Java',
      content: `The Serayu River basin, stretching across Central Java from the volcanic slopes of the Dieng Plateau to the Indian Ocean near Cilacap, represents one of Indonesia's most ecologically diverse and agriculturally vital river systems. Spanning over 3,700 square kilometers, the basin sustains millions of residents through rice cultivation, aquaculture, and hydroelectric power generation.

Historically, the river has played a pivotal role in shaping regional trade networks. During the pre-colonial era, river barges navigated the lower reaches of the Serayu to transport spices, timber, and agricultural goods to coastal ports. The fertile volcanic soils deposited by ancient eruptions of Mount Slamet and the Dieng volcanic complex provided unmatched agricultural yields, laying the foundation for prosperous agrarian communities.

However, rapid industrialization and agricultural expansion during the late twentieth century introduced severe ecological pressures. Deforestation on steep upper slopes accelerated soil erosion, causing substantial siltation in downstream reservoirs such as the Mrica Hydroelectric Dam in Banjarnegara. Siltation not only diminishes the water storage capacity of dams but also exacerbates seasonal flooding during monsoon months.

In response to these environmental challenges, collaborative conservation programs involving regional universities, forestry departments, and local farming cooperatives were established. Initiatives such as agroforestry—combining deep-rooted perennial trees with seasonal crops—have effectively stabilized fragile hillsides while preserving local farmers' livelihoods. Furthermore, systematic water quality monitoring has helped mitigate industrial effluent contamination, offering a sustainable blueprint for river basin management in tropical developing regions.`,
    },
  });

  const passage1Questions = [
    {
      questionText: 'What is the primary topic of the passage?',
      options: [
        { id: 'A', text: 'The history of hydroelectric energy in Banjarnegara.' },
        { id: 'B', text: 'The ecological importance, historical role, and conservation efforts of the Serayu River basin.' },
        { id: 'C', text: 'Volcanic eruption patterns of Mount Slamet.' },
        { id: 'D', text: 'Pre-colonial maritime trading routes in Central Java.' }
      ],
      correctOption: 'B',
      skillTag: 'Main Idea Question',
      explanation: 'The passage comprehensively covers the river\'s ecological role, history, environmental threats, and conservation solutions.',
      difficulty: 'EASY',
    },
    {
      questionText: 'The word "pivotal" in paragraph 2 is closest in meaning to:',
      options: [
        { id: 'A', text: 'crucial' },
        { id: 'B', text: 'minor' },
        { id: 'C', text: 'unrelated' },
        { id: 'D', text: 'temporary' }
      ],
      correctOption: 'A',
      skillTag: 'Vocabulary in Context',
      explanation: '"Pivotal" means playing a central, essential, or crucial role in a process.',
      difficulty: 'EASY',
    },
    {
      questionText: 'According to paragraph 2, what rendered the land surrounding the Serayu River highly suitable for agriculture?',
      options: [
        { id: 'A', text: 'Heavy commercial fertilizers.' },
        { id: 'B', text: 'Fertile volcanic soil deposits from ancient eruptions.' },
        { id: 'C', text: 'Artificial irrigation pipelines built by colonizers.' },
        { id: 'D', text: 'Continuous saltwater flooding from the ocean.' }
      ],
      correctOption: 'B',
      skillTag: 'Factual Detail Question',
      explanation: 'The text explicitly states that volcanic soils deposited by Mount Slamet and Dieng provided unmatched agricultural fertility.',
      difficulty: 'EASY',
    },
    {
      questionText: 'Which of the following was a major consequence of deforestation on upper river slopes?',
      options: [
        { id: 'A', text: 'Decreased rainfall across Banjarnegara.' },
        { id: 'B', text: 'Accelerated soil erosion leading to reservoir siltation.' },
        { id: 'C', text: 'Complete drying of the Indian Ocean estuary.' },
        { id: 'D', text: 'Immediate cessation of rice farming.' }
      ],
      correctOption: 'B',
      skillTag: 'Cause & Effect Detail',
      explanation: 'Paragraph 3 notes that deforestation caused soil erosion, which led to heavy siltation in the Mrica Dam reservoir.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'The word "exacerbates" in paragraph 3 could best be replaced by:',
      options: [
        { id: 'A', text: 'worsens' },
        { id: 'B', text: 'relieves' },
        { id: 'C', text: 'prevents' },
        { id: 'D', text: 'measures' }
      ],
      correctOption: 'A',
      skillTag: 'Vocabulary in Context',
      explanation: '"Exacerbate" means to make a problem or bad situation worse.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'It can be inferred from paragraph 4 that agroforestry is effective because:',
      options: [
        { id: 'A', text: 'It eliminates the need for any water supply.' },
        { id: 'B', text: 'Deep-rooted trees hold topsoil in place on steep slopes while generating income.' },
        { id: 'C', text: 'It prevents all industrial factories from operating.' },
        { id: 'D', text: 'It relies exclusively on synthetic chemical sprays.' }
      ],
      correctOption: 'B',
      skillTag: 'Inference Question',
      explanation: 'Agroforestry combines deep-rooted trees (which anchor soil against erosion) with seasonal crops for farmers.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'The author mentions the "Mrica Hydroelectric Dam" in paragraph 3 to illustrate:',
      options: [
        { id: 'A', text: 'The success of modern green energy projects.' },
        { id: 'B', text: 'A specific infrastructure facility affected by upstream soil erosion.' },
        { id: 'C', text: 'The oldest dam constructed in Southeast Asia.' },
        { id: 'D', text: 'An example of pre-colonial engineering.' }
      ],
      correctOption: 'B',
      skillTag: 'Rhetorical Purpose Question',
      explanation: 'The Mrica Dam is mentioned to demonstrate the tangible negative impact of upstream deforestation and siltation.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'Which of the following is NOT mentioned as a benefit of the Serayu River system?',
      options: [
        { id: 'A', text: 'Rice cultivation.' },
        { id: 'B', text: 'Aquaculture.' },
        { id: 'C', text: 'Geothermal space heating for domestic homes.' },
        { id: 'D', text: 'Hydroelectric power generation.' }
      ],
      correctOption: 'C',
      skillTag: 'Negative Fact Question',
      explanation: 'Paragraph 1 mentions rice cultivation, aquaculture, and hydroelectric power, but NOT domestic geothermal space heating.',
      difficulty: 'EASY',
    },
    {
      questionText: 'The word "effluent" in paragraph 4 refers to:',
      options: [
        { id: 'A', text: 'liquid waste or sewage discharged into water bodies' },
        { id: 'B', text: 'clean drinking water reserves' },
        { id: 'C', text: 'organic plant fertilizers' },
        { id: 'D', text: 'volcanic ash particles' }
      ],
      correctOption: 'A',
      skillTag: 'Vocabulary in Context',
      explanation: '"Effluent" refers to liquid industrial waste or sewage discharged into waterways.',
      difficulty: 'HARD',
    },
    {
      questionText: 'Where in the passage does the author discuss community-led conservation solutions?',
      options: [
        { id: 'A', text: 'Paragraph 1' },
        { id: 'B', text: 'Paragraph 2' },
        { id: 'C', text: 'Paragraph 3' },
        { id: 'D', text: 'Paragraph 4' }
      ],
      correctOption: 'D',
      skillTag: 'Locating Information',
      explanation: 'Paragraph 4 specifically details conservation initiatives like agroforestry and water monitoring.',
      difficulty: 'EASY',
    },
  ];

  for (const q of passage1Questions) {
    await db.question.create({
      data: {
        section: 'READING',
        passageId: passage1.id,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        skillTag: q.skillTag,
        difficulty: q.difficulty,
        status: 'APPROVED',
      },
    });
  }

  // PASSAGE 2
  const passage2 = await db.passage.create({
    data: {
      title: 'The Mechanics of Solar Cells & Clean Energy Transition',
      content: `Photovoltaic (PV) cells, commonly referred to as solar cells, represent the cornerstone of modern renewable energy technology. These semiconductor devices convert radiant sunlight directly into electricity through the photovoltaic effect, a physical process first observed by French physicist Edmond Becquerel in 1839.

At the core of a conventional solar cell is a thin wafer composed of silicon, an abundant element derived from quartz sand. To create an electric field, the silicon wafer is chemically treated or "doped" with trace impurities. One layer is infused with phosphorus, providing an excess of mobile electrons (N-type silicon), while the adjacent layer is treated with boron, creating electron deficiencies or "holes" (P-type silicon). The boundary where these two layers meet is known as the P-N junction.

When sunlight strikes the solar cell, photons collide with silicon atoms, energizing bound electrons and knocking them free. Guided by the electric field created at the P-N junction, these freed electrons flow systematically toward metal contacts on the cell surface, generating a continuous direct current (DC). Inverters then convert this DC electricity into alternating current (AC), making it compatible with grid networks and household appliances.

Despite rapid advancements, commercial silicon solar cells face physical efficiency limits, typically converting only 15 to 22 percent of incoming sunlight into usable energy. Energy loss occurs primarily because solar photons carry varying wavelengths; some lack sufficient energy to free electrons, while others possess excess energy that dissipates as thermal heat. To overcome these limitations, researchers are developing multi-junction tandem cells utilizing perovskite materials, which absorb broader spectral bands and promise conversion efficiencies exceeding 30 percent.`,
    },
  });

  const passage2Questions = [
    {
      questionText: 'What is the main topic of the passage?',
      options: [
        { id: 'A', text: 'The life biography of French physicist Edmond Becquerel.' },
        { id: 'B', text: 'The chemical composition of quartz sand.' },
        { id: 'C', text: 'The operating principles, limitations, and future innovations of photovoltaic solar cells.' },
        { id: 'D', text: 'The financial cost of installing household electrical inverters.' }
      ],
      correctOption: 'C',
      skillTag: 'Main Idea Question',
      explanation: 'The text explains how solar cells work chemically/physically, their efficiency limits, and tandem cell innovations.',
      difficulty: 'EASY',
    },
    {
      questionText: 'According to paragraph 2, what creates N-type silicon in a solar cell?',
      options: [
        { id: 'A', text: 'Infusing silicon with phosphorus to create extra mobile electrons.' },
        { id: 'B', text: 'Treating silicon with boron to create electron deficiencies.' },
        { id: 'C', text: 'Exposing raw silicon to extreme heat.' },
        { id: 'D', text: 'Melting quartz sand in water.' }
      ],
      correctOption: 'A',
      skillTag: 'Factual Detail Question',
      explanation: 'Paragraph 2 explicitly states that N-type silicon is created by infusing phosphorus, providing excess mobile electrons.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'The word "conventional" in paragraph 2 is closest in meaning to:',
      options: [
        { id: 'A', text: 'traditional or standard' },
        { id: 'B', text: 'futuristic' },
        { id: 'C', text: 'ineffective' },
        { id: 'D', text: 'expensive' }
      ],
      correctOption: 'A',
      skillTag: 'Vocabulary in Context',
      explanation: '"Conventional" means standard, traditional, or commonly established.',
      difficulty: 'EASY',
    },
    {
      questionText: 'What role does the inverter play in a solar power system?',
      options: [
        { id: 'A', text: 'It cools the silicon wafer during hot summer days.' },
        { id: 'B', text: 'It converts direct current (DC) into alternating current (AC).' },
        { id: 'C', text: 'It traps extra photons inside the P-N junction.' },
        { id: 'D', text: 'It manufactures boron and phosphorus compounds.' }
      ],
      correctOption: 'B',
      skillTag: 'Factual Detail Question',
      explanation: 'Paragraph 3 states that inverters convert DC electricity generated by the cell into usable AC electricity.',
      difficulty: 'EASY',
    },
    {
      questionText: 'According to paragraph 4, why do standard silicon solar cells lose energy?',
      options: [
        { id: 'A', text: 'Because photons have varying wavelengths, leading to insufficient energy absorption or heat dissipation.' },
        { id: 'B', text: 'Because silicon is too heavy to absorb light.' },
        { id: 'C', text: 'Because solar panels operate only at night.' },
        { id: 'D', text: 'Because phosphorus repels sunlight.' }
      ],
      correctOption: 'A',
      skillTag: 'Scientific Cause & Effect',
      explanation: 'Energy loss occurs because photons have different wavelengths; some lack energy while others produce excess heat.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'The word "dissipates" in paragraph 4 means:',
      options: [
        { id: 'A', text: 'scatters or disperses' },
        { id: 'B', text: 'accumulates' },
        { id: 'C', text: 'freezes' },
        { id: 'D', text: 'multiplies' }
      ],
      correctOption: 'A',
      skillTag: 'Vocabulary in Context',
      explanation: '"Dissipate" means to scatter, disperse, or waste away as heat.',
      difficulty: 'HARD',
    },
    {
      questionText: 'Which material is highlighted as a promising solution for next-generation tandem solar cells?',
      options: [
        { id: 'A', text: 'Perovskite' },
        { id: 'B', text: 'Aluminum' },
        { id: 'C', text: 'Copper' },
        { id: 'D', text: 'Graphite' }
      ],
      correctOption: 'A',
      skillTag: 'Factual Detail Question',
      explanation: 'Paragraph 4 explicitly names perovskite materials for tandem solar cells with over 30% efficiency.',
      difficulty: 'EASY',
    },
    {
      questionText: 'The phrase "electron deficiencies" in paragraph 2 refers to:',
      options: [
        { id: 'A', text: 'places where electrons are missing, known as "holes"' },
        { id: 'B', text: 'excess negative charges' },
        { id: 'C', text: 'damaged solar panel cables' },
        { id: 'D', text: 'battery storage depletion' }
      ],
      correctOption: 'A',
      skillTag: 'Reference & Meaning',
      explanation: 'The text directly equates electron deficiencies with "holes" created in P-type silicon.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'It can be inferred from the passage that perovskite tandem cells are superior to silicon cells because:',
      options: [
        { id: 'A', text: 'They absorb a wider spectrum of sunlight wavelengths.' },
        { id: 'B', text: 'They do not require any sunlight to function.' },
        { id: 'C', text: 'They are made entirely of liquid quartz.' },
        { id: 'D', text: 'They eliminate the need for electrical wires.' }
      ],
      correctOption: 'A',
      skillTag: 'Inference Question',
      explanation: 'Perovskite tandem cells absorb broader spectral bands, overcoming silicon\'s wavelength limitations.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'Where in the passage is the historical discovery of the photovoltaic effect mentioned?',
      options: [
        { id: 'A', text: 'Paragraph 1' },
        { id: 'B', text: 'Paragraph 2' },
        { id: 'C', text: 'Paragraph 3' },
        { id: 'D', text: 'Paragraph 4' }
      ],
      correctOption: 'A',
      skillTag: 'Locating Information',
      explanation: 'Paragraph 1 states that the photovoltaic effect was first observed by Edmond Becquerel in 1839.',
      difficulty: 'EASY',
    },
  ];

  for (const q of passage2Questions) {
    await db.question.create({
      data: {
        section: 'READING',
        passageId: passage2.id,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        skillTag: q.skillTag,
        difficulty: q.difficulty,
        status: 'APPROVED',
      },
    });
  }

  // PASSAGE 3
  const passage3 = await db.passage.create({
    data: {
      title: 'Cognitive Development in Multilingual Academic Environments',
      content: `For decades, educational psychologists debated whether early bilingualism enhanced or hindered intellectual development. In the early twentieth century, flawed research methodologies led to the erroneous conclusion that learning two languages simultaneously burdened a child's cognitive capacity, resulting in lower academic performance. Modern neuroimaging and psycholinguistic studies have completely overturned this outdated dogma.

Recent research demonstrates that bilingual individuals possess distinct cognitive advantages, particularly in executive function—the suite of brain processes responsible for attention control, task switching, working memory, and abstract problem solving. Because both languages remain active simultaneously in the bilingual brain, the executive control system must continuously manage interference, selecting the appropriate vocabulary while suppressing competing words from the non-target language.

This ongoing mental gymnastics fortifies the prefrontal cortex, enhancing neuroplasticity across the lifespan. Empirical studies indicate that bilingual students excel in complex tasks requiring cognitive flexibility and selective focus. Furthermore, neuroscientists have observed that lifelong bilingualism builds cognitive reserve, delaying the clinical onset of neurodegenerative conditions such as Alzheimer's disease by an average of four to five years compared to monolingual adults.

In higher education settings, multilingual students demonstrate heightened metalinguistic awareness—the ability to analyze language as an abstract system. This meta-awareness facilitates faster acquisition of third languages, superior reading comprehension in complex academic literature, and refined intercultural communication skills essential in today's globalized academic community.`,
    },
  });

  const passage3Questions = [
    {
      questionText: 'What is the primary topic of the passage?',
      options: [
        { id: 'A', text: 'The history of early 20th-century intelligence testing.' },
        { id: 'B', text: 'The cognitive, neurological, and academic advantages of multilingualism.' },
        { id: 'C', text: 'Surgical treatment options for Alzheimer\'s disease.' },
        { id: 'D', text: 'The decline of language learning in public schools.' }
      ],
      correctOption: 'B',
      skillTag: 'Main Idea Question',
      explanation: 'The passage explores cognitive benefits, executive function, brain plasticity, and academic advantages of bilingualism.',
      difficulty: 'EASY',
    },
    {
      questionText: 'The word "erroneous" in paragraph 1 is closest in meaning to:',
      options: [
        { id: 'A', text: 'incorrect or mistaken' },
        { id: 'B', text: 'accurate' },
        { id: 'C', text: 'famous' },
        { id: 'D', text: 'irrelevant' }
      ],
      correctOption: 'A',
      skillTag: 'Vocabulary in Context',
      explanation: '"Erroneous" means based on error, mistaken, or incorrect.',
      difficulty: 'EASY',
    },
    {
      questionText: 'According to paragraph 2, what is "executive function"?',
      options: [
        { id: 'A', text: 'Brain processes responsible for attention control, working memory, and task switching.' },
        { id: 'B', text: 'The physical ability to speak loudly.' },
        { id: 'C', text: 'A corporate management style in universities.' },
        { id: 'D', text: 'A computer programming script for translation.' }
      ],
      correctOption: 'A',
      skillTag: 'Factual Detail Question',
      explanation: 'Paragraph 2 explicitly defines executive function as brain processes managing attention, working memory, and problem solving.',
      difficulty: 'EASY',
    },
    {
      questionText: 'Why does the bilingual brain continuously exercise executive control?',
      options: [
        { id: 'A', text: 'Because both languages remain active, requiring the brain to suppress competing words.' },
        { id: 'B', text: 'Because bilingual individuals forget their native language.' },
        { id: 'C', text: 'Because speaking two languages damages memory cells.' },
        { id: 'D', text: 'Because translation apps interfere with speech.' }
      ],
      correctOption: 'A',
      skillTag: 'Cause & Effect Detail',
      explanation: 'Since both languages are active simultaneously, the brain must manage interference by suppressing non-target words.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'The phrase "mental gymnastics" in paragraph 3 refers to:',
      options: [
        { id: 'A', text: 'the continuous cognitive effort of managing two active languages' },
        { id: 'B', text: 'physical exercise conducted in school gymnasiums' },
        { id: 'C', text: 'memorizing sports rules' },
        { id: 'D', text: 'learning sign language' }
      ],
      correctOption: 'A',
      skillTag: 'Metaphorical Meaning',
      explanation: '"Mental gymnastics" is a metaphor for the continuous brain exercise involved in managing dual active languages.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'According to paragraph 3, how does lifelong bilingualism impact neurodegenerative diseases?',
      options: [
        { id: 'A', text: 'It completely eliminates all brain diseases.' },
        { id: 'B', text: 'It delays the clinical onset of Alzheimer\'s symptoms by 4 to 5 years.' },
        { id: 'C', text: 'It causes earlier memory loss.' },
        { id: 'D', text: 'It has no effect on brain health.' }
      ],
      correctOption: 'B',
      skillTag: 'Factual Detail Question',
      explanation: 'The text notes that cognitive reserve built by bilingualism delays Alzheimer\'s onset by 4-5 years.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'What is "metalinguistic awareness" as defined in paragraph 4?',
      options: [
        { id: 'A', text: 'The ability to analyze language as an abstract system.' },
        { id: 'B', text: 'Knowing how to write poetry.' },
        { id: 'C', text: 'Translating words word-for-word.' },
        { id: 'D', text: 'Speaking with a foreign accent.' }
      ],
      correctOption: 'A',
      skillTag: 'Definition Detail',
      explanation: 'Paragraph 4 explicitly defines metalinguistic awareness as the ability to analyze language as an abstract system.',
      difficulty: 'EASY',
    },
    {
      questionText: 'The word "fortifies" in paragraph 3 is closest in meaning to:',
      options: [
        { id: 'A', text: 'strengthens' },
        { id: 'B', text: 'weakens' },
        { id: 'C', text: 'divides' },
        { id: 'D', text: 'ignores' }
      ],
      correctOption: 'A',
      skillTag: 'Vocabulary in Context',
      explanation: '"Fortify" means to strengthen or reinforce.',
      difficulty: 'EASY',
    },
    {
      questionText: 'It can be inferred from paragraph 1 that early 20th-century studies were flawed because:',
      options: [
        { id: 'A', text: 'They used improper research methodologies that overlooked socioeconomic factors.' },
        { id: 'B', text: 'They relied on modern MRI brain scans.' },
        { id: 'C', text: 'They tested students who spoke five languages.' },
        { id: 'D', text: 'They were conducted only in Asia.' }
      ],
      correctOption: 'A',
      skillTag: 'Inference Question',
      explanation: 'Paragraph 1 mentions that flawed research methodologies caused erroneous conclusions about bilingualism.',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'Where in the passage does the author discuss the impact of bilingualism on acquiring additional languages?',
      options: [
        { id: 'A', text: 'Paragraph 1' },
        { id: 'B', text: 'Paragraph 2' },
        { id: 'C', text: 'Paragraph 3' },
        { id: 'D', text: 'Paragraph 4' }
      ],
      correctOption: 'D',
      skillTag: 'Locating Information',
      explanation: 'Paragraph 4 explains that metalinguistic awareness facilitates faster acquisition of third languages.',
      difficulty: 'EASY',
    },
  ];

  for (const q of passage3Questions) {
    await db.question.create({
      data: {
        section: 'READING',
        passageId: passage3.id,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        skillTag: q.skillTag,
        difficulty: q.difficulty,
        status: 'APPROVED',
      },
    });
  }

  console.log('✅ 30 Soal Reading Comprehension (3 Passages) berhasil di-seed!');
  console.log('\n🎉 SUKSES! TOTAL 90 SOAL EPT (30 Listening, 30 Structure, 30 Reading) TELAH TERSEDIA DI BANK SOAL EPTUNU!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding soal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
