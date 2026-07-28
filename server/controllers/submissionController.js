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

// 3. Fetch ALL submissions for the Admin Audit view
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        // This acts like a SQL JOIN, fetching the submitter's details
        associate: {
          select: { name: true, employeeId: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { submissions } });
  } catch (error) {
    console.error("Admin Fetch Submissions Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch all submissions.' });
  }
};

// 4. Update an existing submission (Associates only)
exports.updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionData } = req.body;
    const associateId = req.user.id;

    if (!submissionData) {
      return res.status(400).json({ status: 'fail', message: 'No updated data provided.' });
    }

    // 1. Fetch the existing submission to verify ownership
    const existingSubmission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!existingSubmission) {
      return res.status(404).json({ status: 'fail', message: 'Submission not found.' });
    }

    // 2. Security Check: Prevent editing someone else's submission
    if (existingSubmission.associateId !== associateId) {
      return res.status(403).json({ status: 'fail', message: 'You can only edit your own submissions.' });
    }

    // 3. Apply the update, flagging it as edited
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        submissionData, // Overwrite with new JSON
        isEdited: true  // Set the audit flag
        // updatedAt is handled automatically by Prisma
      }
    });

    res.status(200).json({ status: 'success', data: { submission: updatedSubmission } });
  } catch (error) {
    console.error("Update Submission Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to update submission.' });
  }
};