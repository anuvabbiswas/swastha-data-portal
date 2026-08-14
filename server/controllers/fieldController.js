const prisma = require('../utils/prisma');


exports.getFields = async (req, res) => {
  try {
    const { formType } = req.params;
    
    const fields = await prisma.fieldDefinition.findMany({
      where: { 
        formType: formType.toUpperCase(),
        isActive: true
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.status(200).json({ status: 'success', data: { fields } });
  } catch (error) {
    console.error("Error fetching fields:", error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch form fields.' });
  }
};

exports.createField = async (req, res) => {
  try {
    const { formType, fieldLabel, description, inputType, isRequired, options, displayOrder, allowOther } = req.body;
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
        description: description || null,
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

exports.reorderFields = async (req, res) => {
  try {
    const { fields } = req.body;

    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid payload.' });
    }

    
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

exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    const { fieldLabel, description, inputType, isRequired, options, allowOther } = req.body;

    if (!fieldLabel || !inputType) {
      return res.status(400).json({ status: 'fail', message: 'Missing required field properties.' });
    }

    const existingField = await prisma.fieldDefinition.findUnique({ where: { id } });
    if (!existingField) {
      return res.status(404).json({ status: 'fail', message: 'Field not found.' });
    }

    const updatedField = await prisma.fieldDefinition.update({
      where: { id },
      data: {
        fieldLabel,
        description: description || null,
        inputType,
        isRequired: isRequired || false,
        options: options || null,
        allowOther: allowOther || false
      }
    });

    res.status(200).json({ status: 'success', data: { field: updatedField } });
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update field.' });
  }
};