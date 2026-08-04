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

    // This handles BOTH Single Date and Date Range. 
    // The frontend will simply send the start and end of whatever period it wants.
    if (startDate && endDate) {
      whereClause.submittedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // 2. Fetch submissions
    const submissions = await prisma.submission.findMany({
      where: whereClause,
      select: { submissionData: true, schemaSnapshot: true } // Only fetch what we need for speed
    });

    const totalSubmissions = submissions.length;
    const questionsMap = new Map();

    // 3. Aggregate Data in Memory
    submissions.forEach(sub => {
      // Parse snapshot safely
      const snapshot = typeof sub.schemaSnapshot === 'string' 
        ? JSON.parse(sub.schemaSnapshot) 
        : sub.schemaSnapshot;

      snapshot.forEach(field => {
        // Only process supported chart types
        if (['DROPDOWN', 'MULTI_SELECT', 'YES_NO'].includes(field.inputType)) {
          
          // Initialize question in our map if it doesn't exist
          if (!questionsMap.has(field.fieldLabel)) {
            questionsMap.set(field.fieldLabel, {
              type: field.inputType,
              counts: {}
            });
          }

          const answer = sub.submissionData[field.fieldLabel];
          if (!answer) return; // Skip if they didn't answer this question

          const qData = questionsMap.get(field.fieldLabel);

          // Helper function to tally answers and group "Other"
          const processAnswer = (ans) => {
            let parsedAns = ans;
            // Option A: Group all custom responses under the label "Other"
            if (typeof ans === 'string' && ans.startsWith('Other: ')) {
              parsedAns = 'Other';
            }
            qData.counts[parsedAns] = (qData.counts[parsedAns] || 0) + 1;
          };

          // Handle Multi-Select (Arrays) vs Dropdown/Yes-No (Strings)
          if (Array.isArray(answer)) {
            answer.forEach(processAnswer);
          } else {
            processAnswer(answer);
          }
        }
      });
    });

    // 4. Format the aggregated data for Recharts
    const chartsData = Array.from(questionsMap.entries()).map(([question, data]) => {
      const chartDataArray = Object.entries(data.counts).map(([option, count]) => ({
        name: option,
        value: count // Recharts expects 'value' for Pie charts, but works for Bar charts too
      }));

      // Sort array so highest counts appear first in tooltips/legends
      chartDataArray.sort((a, b) => b.value - a.value);

      return {
        question,
        type: data.type,
        data: chartDataArray,
        hasData: chartDataArray.length > 0 // Determines if we show the "Not enough data" placeholder
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