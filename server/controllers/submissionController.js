const prisma = require('../utils/prisma');
const fs = require('fs');
const path = require('path');

exports.createSubmission = async (req, res) => {
  try {
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

exports.getMySubmissions = async (req, res) => {
  try {
    const associateId = req.user.id;

    const submissions = await prisma.submission.findMany({
      where: { associateId },
      orderBy: { submittedAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { submissions } });
  } catch (error) {
    console.error("Fetch Submissions Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch your submissions.' });
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
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

exports.updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionData } = req.body;
    const associateId = req.user.id;

    if (!submissionData) {
      return res.status(400).json({ status: 'fail', message: 'No updated data provided.' });
    }

    const existingSubmission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!existingSubmission) {
      return res.status(404).json({ status: 'fail', message: 'Submission not found.' });
    }

    if (existingSubmission.associateId !== associateId) {
      return res.status(403).json({ status: 'fail', message: 'You can only edit your own submissions.' });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        submissionData,
        isEdited: true
      }
    });

    res.status(200).json({ status: 'success', data: { submission: updatedSubmission } });
  } catch (error) {
    console.error("Update Submission Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to update submission.' });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!submission) {
      return res.status(404).json({ status: 'fail', message: 'Submission not found.' });
    }

    const snapshot = typeof submission.schemaSnapshot === 'string' 
      ? JSON.parse(submission.schemaSnapshot) 
      : submission.schemaSnapshot;

    const mediaFields = snapshot.filter(field => field.inputType === 'UPLOAD_MEDIA');

    for (const field of mediaFields) {
      const filename = submission.submissionData[field.fieldLabel];
      
      if (filename && typeof filename === 'string') {
        const filepath = path.join(__dirname, '../uploads', path.basename(filename));
        
        if (fs.existsSync(filepath)) {
          try {
            fs.unlinkSync(filepath);
            console.log(`[Cleanup] Deleted orphaned file: ${filename}`);
          } catch (fileErr) {
            console.error(`[Cleanup Error] Failed to delete file ${filename}:`, fileErr);
          }
        }
      }
    }

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