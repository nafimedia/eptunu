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

    // Lookup Scaled Scores with smart boundary clamping
    const conversions = await tx.scoreConversion.findMany();
    const getScaled = (section: SectionType, raw: number) => {
      const sectionConversions = conversions
        .filter(c => c.section === section)
        .sort((a, b) => a.rawScore - b.rawScore);

      if (sectionConversions.length === 0) return 31;

      const minEntry = sectionConversions[0];
      const maxEntry = sectionConversions[sectionConversions.length - 1];

      if (raw >= maxEntry.rawScore) return maxEntry.scaledScore;
      if (raw <= minEntry.rawScore) return minEntry.scaledScore;

      const match = sectionConversions.find(c => c.rawScore === raw);
      return match ? match.scaledScore : minEntry.scaledScore;
    };

    const scaledListening = getScaled(SectionType.LISTENING, rawListening);
    const scaledStructure = getScaled(SectionType.STRUCTURE, rawStructure);
    const scaledReading = getScaled(SectionType.READING, rawReading);

    // TOEFL ITP Formula: ((Listening + Structure + Reading) * 10) / 3
    const totalScore = Math.round(((scaledListening + scaledStructure + scaledReading) * 10) / 3);

    const finalStatus = studentExam.status === 'FORCE_SUBMITTED' ? 'FORCE_SUBMITTED' : 'SUBMITTED';

    return await tx.studentExam.update({
      where: { id: studentExamId },
      data: {
        status: finalStatus,
        submittedAt: studentExam.submittedAt || new Date(),
        scoreListening: scaledListening,
        scoreStructure: scaledStructure,
        scoreReading: scaledReading,
        totalScore: totalScore
      }
    });
  }, { isolationLevel: 'Serializable' });
}
