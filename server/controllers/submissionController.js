const prisma = require('../utils/prisma');
const fs = require('fs');
const path = require('path');

// 1. Create a new data submission
exports.createSubmission = async (req, res) => {
  try {
    // submissionData is a flexible JSON object (e.g., { "Question 1": "Answer 1" })
    const { submissionData } = req.body;

    if (!submissionData) {
      return res.status(400).json({ status: 'fail', message: 'Missing submission data.' });
    }

    const formType = req.user.role.toUpperCase();

    const activeFields = await prisma.fieldDefinition.findMany({
      where: { 
        formType,
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
        associateId: req.user.id,
        associateName: req.user.name,
        associateEmployeeId: req.user.employeeId,
        formType,
        submissionData,
        schemaSnapshot: activeFields
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

// 5. Permanently delete a submission (Admin only)
exports.deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch the submission BEFORE deleting it so we can inspect its payload
    const submission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!submission) {
      return res.status(404).json({ status: 'fail', message: 'Submission not found.' });
    }

    // 2. Parse the frozen schema snapshot to reliably identify media fields
    const snapshot = typeof submission.schemaSnapshot === 'string' 
      ? JSON.parse(submission.schemaSnapshot) 
      : submission.schemaSnapshot;

    const mediaFields = snapshot.filter(field => field.inputType === 'UPLOAD_MEDIA');

    // 3. Iterate through media fields and securely delete the physical files
    for (const field of mediaFields) {
      const filename = submission.submissionData[field.fieldLabel];
      
      if (filename && typeof filename === 'string') {
        // Prevent path traversal by strictly joining with the uploads directory
        const filepath = path.join(__dirname, '../uploads', path.basename(filename));
        
        // 4. Data Integrity & Error Handling
        if (fs.existsSync(filepath)) {
          try {
            fs.unlinkSync(filepath);
            console.log(`[Cleanup] Deleted orphaned file: ${filename}`);
          } catch (fileErr) {
            console.error(`[Cleanup Error] Failed to delete file ${filename}:`, fileErr);
            // We intentionally do not throw here. If file deletion fails 
            // (e.g., file already missing or permissions issue), we still 
            // want to allow the database record to be deleted so it doesn't get stuck.
          }
        }
      }
    }

    // 5. Finally, safely delete the database record
    await prisma.submission.delete({
      where: { id }
    });

    res.status(200).json({ 
      status: 'success', 
      message: 'Submission and associated media files permanently deleted.' 
    });

  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete submission.' });
  }
};