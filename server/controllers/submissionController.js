const prisma = require('../utils/prisma');

// 1. Create a new data submission
exports.createSubmission = async (req, res) => {
  try {
    // submissionData is a flexible JSON object (e.g., { "Question 1": "Answer 1" })
    const { formType, submissionData } = req.body;
    const associateId = req.user.id; // Pulled from the JWT token middleware

    if (!formType || !submissionData) {
      return res.status(400).json({ status: 'fail', message: 'Missing form type or submission data.' });
    }

    // Step A: Fetch the CURRENT active field definitions for this form type
    const activeFields = await prisma.fieldDefinition.findMany({
      where: { 
        formType: formType.toUpperCase(),
        isActive: true 
      },
      orderBy: { displayOrder: 'asc' }
    });

    if (activeFields.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'No active fields exist for this form. Please contact an Administrator.' });
    }

    // Step B: Save the data AND the snapshot of the schema simultaneously
    const newSubmission = await prisma.submission.create({
      data: {
        associateId,
        formType: formType.toUpperCase(),
        submissionData,
        schemaSnapshot: activeFields // Storing the array of objects directly into the JSON column
      }
    });

    res.status(201).json({ status: 'success', data: { submission: newSubmission } });
  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to save submission.' });
  }
};

// 2. Fetch submissions for the currently logged-in associate
exports.getMySubmissions = async (req, res) => {
  try {
    const associateId = req.user.id;

    const submissions = await prisma.submission.findMany({
      where: { associateId },
      orderBy: { submittedAt: 'desc' } // Newest first
    });

    res.status(200).json({ status: 'success', data: { submissions } });
  } catch (error) {
    console.error("Fetch Submissions Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch your submissions.' });
  }
};