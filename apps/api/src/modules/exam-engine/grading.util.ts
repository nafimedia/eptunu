import { PrismaClient, SectionType } from '@starter-kit/database';

export async function calculateEptScore(prisma: PrismaClient, studentExamId: string) {
  return await prisma.$transaction(async (tx) => {
    const studentExam = await tx.studentExam.findUnique({
      where: { id: studentExamId },
      include: {
        answers: true
      }
    });

    if (!studentExam) throw new Error('Student Exam Record Not Found');

    // Fetch all questions to match correct options
    const questions = await tx.question.findMany({
      select: { id: true, section: true, correctOption: true }
    });

    const questionMap = new Map(questions.map(q => [q.id, q]));

    let rawListening = 0;
    let rawStructure = 0;
    let rawReading = 0;

    for (const ans of studentExam.answers) {
      const q = questionMap.get(ans.questionId);
      if (q && ans.selectedOption === q.correctOption) {
        if (q.section === SectionType.LISTENING) rawListening++;
        if (q.section === SectionType.STRUCTURE) rawStructure++;
        if (q.section === SectionType.READING) rawReading++;
      }
    }

    // Lookup Scaled Scores
    const conversions = await tx.scoreConversion.findMany();
    const getScaled = (section: SectionType, raw: number) => {
      const match = conversions.find(c => c.section === section && c.rawScore === raw);
      return match ? match.scaledScore : 31; // Default floor
    };

    const scaledListening = getScaled(SectionType.LISTENING, rawListening);
    const scaledStructure = getScaled(SectionType.STRUCTURE, rawStructure);
    const scaledReading = getScaled(SectionType.READING, rawReading);

    // TOEFL ITP Formula: ((Listening + Structure + Reading) * 10) / 3
    const totalScore = Math.round(((scaledListening + scaledStructure + scaledReading) * 10) / 3);

    return await tx.studentExam.update({
      where: { id: studentExamId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        scoreListening: scaledListening,
        scoreStructure: scaledStructure,
        scoreReading: scaledReading,
        totalScore: totalScore
      }
    });
  }, { isolationLevel: 'Serializable' });
}
