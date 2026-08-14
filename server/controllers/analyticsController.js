const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAnalytics = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    if (!category) {
      return res.status(400).json({ status: 'fail', message: 'Category is required (MARKETING or COMMUNITY).' });
    }

    // 1. Build the database query filter
    let whereClause = { formType: category };

    if (startDate && endDate) {
      whereClause.submittedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // 2. Fetch submissions
    const submissions = await prisma.submission.findMany({
      where: whereClause,
      select: { submissionData: true, schemaSnapshot: true }
    });

    const totalSubmissions = submissions.length;
    const questionsMap = new Map();

    // 3. Aggregate Data in Memory
    submissions.forEach(sub => {
      const snapshot = typeof sub.schemaSnapshot === 'string' 
        ? JSON.parse(sub.schemaSnapshot) 
        : sub.schemaSnapshot;

      snapshot.forEach(field => {
        if (['DROPDOWN', 'MULTI_SELECT', 'YES_NO'].includes(field.inputType)) {
          
          if (!questionsMap.has(field.fieldLabel)) {
            questionsMap.set(field.fieldLabel, {
              type: field.inputType,
              counts: {}
            });
          }

          const answer = sub.submissionData[field.fieldLabel];
          if (!answer) return;
          const qData = questionsMap.get(field.fieldLabel);
          const processAnswer = (ans) => {
            let parsedAns = ans;
            if (typeof ans === 'string' && ans.startsWith('Other: ')) {
              parsedAns = 'Other';
            }
            qData.counts[parsedAns] = (qData.counts[parsedAns] || 0) + 1;
          };

          if (Array.isArray(answer)) {
            answer.forEach(processAnswer);
          } else {
            processAnswer(answer);
          }
        }
      });
    });

    const chartsData = Array.from(questionsMap.entries()).map(([question, data]) => {
      const chartDataArray = Object.entries(data.counts).map(([option, count]) => ({
        name: option,
        value: count
      }));

      chartDataArray.sort((a, b) => b.value - a.value);

      return {
        question,
        type: data.type,
        data: chartDataArray,
        hasData: chartDataArray.length > 0
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalSubmissions,
        charts: chartsData
      }
    });

  } catch (error) {
    console.error("Analytics Aggregation Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to generate analytics.' });
  }
};