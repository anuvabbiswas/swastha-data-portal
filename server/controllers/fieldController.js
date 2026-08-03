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
    const { formType, fieldLabel, inputType, isRequired, options, displayOrder, allowOther } = req.body;

    if (!formType || !fieldLabel || !inputType) {
      return res.status(400).json({ status: 'fail', message: 'Missing required field properties.' });
    }

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
        options: options || null,
        displayOrder: order,
        allowOther: allowOther || false 
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

// Bulk update the display order of fields
exports.reorderFields = async (req, res) => {
  try {
    const { fields } = req.body; // Expects an array: [{ id: "123", displayOrder: 0 }, ...]

    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid payload.' });
    }

    // Use a Prisma transaction to ensure ALL fields update successfully, or NONE do.
    const transaction = fields.map(field => 
      prisma.fieldDefinition.update({
        where: { id: field.id },
        data: { displayOrder: field.displayOrder }
      })
    );

    await prisma.$transaction(transaction);

    res.status(200).json({ status: 'success', message: 'Fields reordered successfully.' });
  } catch (error) {
    console.error("Reorder fields error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to save new field order.' });
  }
};