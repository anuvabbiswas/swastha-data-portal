const prisma = require('../utils/prisma');

// Fetch all active fields for a specific form type
exports.getFields = async (req, res) => {
  try {
    const { formType } = req.params; // 'MARKETING' or 'COMMUNITY'
    
    const fields = await prisma.fieldDefinition.findMany({
      where: { 
        formType: formType.toUpperCase(),
        isActive: true // We only want to render active fields
      },
      orderBy: { displayOrder: 'asc' } // Ensure questions appear in the order the admin created them
    });

    res.status(200).json({ status: 'success', data: { fields } });
  } catch (error) {
    console.error("Error fetching fields:", error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch form fields.' });
  }
};

// Create a new field definition
exports.createField = async (req, res) => {
  try {
    const { formType, fieldLabel, inputType, isRequired, options, displayOrder } = req.body;

    // Validation
    if (!formType || !fieldLabel || !inputType) {
      return res.status(400).json({ status: 'fail', message: 'Missing required field properties.' });
    }

    // Determine the display order if not provided
    let order = displayOrder;
    if (order === undefined) {
      const lastField = await prisma.fieldDefinition.findFirst({
        where: { formType: formType.toUpperCase() },
        orderBy: { displayOrder: 'desc' }
      });
      order = lastField ? lastField.displayOrder + 1 : 0;
    }

    const newField = await prisma.fieldDefinition.create({
      data: {
        formType: formType.toUpperCase(),
        fieldLabel,
        inputType,
        isRequired: isRequired || false,
        options: options || null, // Options will be an array like ["Yes", "No"] for Dropdowns
        displayOrder: order
      }
    });

    res.status(201).json({ status: 'success', data: { field: newField } });
  } catch (error) {
    console.error("Error creating field:", error);
    res.status(500).json({ status: 'error', message: 'Failed to create field.' });
  }
};

// Soft delete a field (Set isActive to false)
// We never hard delete fields, so old historical submissions don't lose context
exports.deactivateField = async (req, res) => {
  try {
    const { id } = req.params;

    const field = await prisma.fieldDefinition.findUnique({ where: { id } });
    if (!field) return res.status(404).json({ status: 'fail', message: 'Field not found.' });

    await prisma.fieldDefinition.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(200).json({ status: 'success', message: 'Field deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to deactivate field.' });
  }
};