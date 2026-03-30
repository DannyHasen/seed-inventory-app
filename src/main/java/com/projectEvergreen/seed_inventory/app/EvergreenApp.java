package com.projectEvergreen.seed_inventory.app;

import com.projectEvergreen.seed_inventory.io.CropStore;
import com.projectEvergreen.seed_inventory.model.Crop;
import com.projectEvergreen.seed_inventory.model.Crop.Season;

import javax.swing.*;
import javax.swing.table.AbstractTableModel;
import javax.swing.DefaultCellEditor;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.GridLayout;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class EvergreenApp extends JFrame
{
    private final CropStore store = CropStore.defaultStore();
    private final CropTableModel tableModel = new CropTableModel();

    public EvergreenApp()
    {
        super("Evergreen - Seed Inventory");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLayout(new BorderLayout());

        JTable table = new JTable(tableModel);
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.setRowSelectionAllowed(true);
        table.setColumnSelectionAllowed(false);
        table.setCellSelectionEnabled(false);

        table.getColumnModel().getColumn(2).setCellEditor(
            new ValidatingIntegerCellEditor("Amount", false)
        );
        table.getColumnModel().getColumn(3).setCellEditor(
            new ValidatingIntegerCellEditor("Avg Days", true)
        );

        add(new JScrollPane(table), BorderLayout.CENTER);

        JPanel form = new JPanel(new GridLayout(2, 5, 8, 8));

        JTextField name = new JTextField();
        JComboBox<Season> season = new JComboBox<>(Season.values());
        JSpinner amount = new JSpinner(new SpinnerNumberModel(0, 0, 1_000_000, 1));
        JSpinner avgDays = new JSpinner(new SpinnerNumberModel(0, 0, 3650, 1));

        JButton add = new JButton("Add");

        form.add(new JLabel("Name"));
        form.add(new JLabel("Season"));
        form.add(new JLabel("Amount"));
        form.add(new JLabel("Avg Days"));
        form.add(new JLabel(""));

        form.add(name);
        form.add(season);
        form.add(amount);
        form.add(avgDays);
        form.add(add);

        add(form, BorderLayout.NORTH);

        JPanel buttons = new JPanel();

        JButton del = new JButton("Delete");
        JButton save = new JButton("Save");
        JButton load = new JButton("Load");

        buttons.add(del);
        buttons.add(save);
        buttons.add(load);

        add(buttons, BorderLayout.SOUTH);

        add.addActionListener(e ->
        {
            String n = name.getText().trim();

            if (n.isEmpty())
            {
                JOptionPane.showMessageDialog(
                    this,
                    "Name is required.",
                    "Invalid Input",
                    JOptionPane.WARNING_MESSAGE
                );
                return;
            }

            int amt = (Integer) amount.getValue();
            int avg = (Integer) avgDays.getValue();
            Integer avgOrNull = (avg == 0 ? null : avg);

            try
            {
                tableModel.add(new Crop(
                    n,
                    (Season) season.getSelectedItem(),
                    amt,
                    avgOrNull
                ));

                name.setText("");
                season.setSelectedIndex(0);
                amount.setValue(0);
                avgDays.setValue(0);
                table.clearSelection();
            }
            catch (IllegalArgumentException ex)
            {
                JOptionPane.showMessageDialog(
                    this,
                    ex.getMessage(),
                    "Invalid Input",
                    JOptionPane.WARNING_MESSAGE
                );
            }
        });

        del.addActionListener(e ->
        {
            if (table.isEditing())
            {
                TableCellEditor editor = table.getCellEditor();
                if (editor != null)
                {
                    editor.stopCellEditing();
                }
            }

            int row = table.getSelectedRow();

            if (row < 0)
            {
                JOptionPane.showMessageDialog(
                    this,
                    "Please select an item to delete.",
                    "No Selection",
                    JOptionPane.WARNING_MESSAGE
                );
                return;
            }

            tableModel.remove(row);
            table.clearSelection();
        });

        save.addActionListener(e ->
        {
            if (table.isEditing())
            {
                TableCellEditor editor = table.getCellEditor();
                if (editor != null && !editor.stopCellEditing())
                {
                    return;
                }
            }

            try
            {
                store.saveAll(tableModel.data);
                JOptionPane.showMessageDialog(
                    this,
                    "Saved successfully.",
                    "Save Complete",
                    JOptionPane.INFORMATION_MESSAGE
                );
            }
            catch (IOException ex)
            {
                JOptionPane.showMessageDialog(
                    this,
                    "Save failed: " + ex.getMessage(),
                    "Save Error",
                    JOptionPane.ERROR_MESSAGE
                );
            }
            catch (IllegalArgumentException ex)
            {
                JOptionPane.showMessageDialog(
                    this,
                    ex.getMessage(),
                    "Invalid Data",
                    JOptionPane.WARNING_MESSAGE
                );
            }
        });

        load.addActionListener(e ->
        {
            if (table.isEditing())
            {
                TableCellEditor editor = table.getCellEditor();
                if (editor != null)
                {
                    editor.stopCellEditing();
                }
            }

            try
            {
                List<Crop> list = store.loadAll();
                tableModel.setAll(list);
                table.clearSelection();

                JOptionPane.showMessageDialog(
                    this,
                    "Loaded successfully.",
                    "Load Complete",
                    JOptionPane.INFORMATION_MESSAGE
                );
            }
            catch (IOException ex)
            {
                JOptionPane.showMessageDialog(
                    this,
                    "Load failed: " + ex.getMessage(),
                    "Load Error",
                    JOptionPane.ERROR_MESSAGE
                );
            }
            catch (IllegalArgumentException ex)
            {
                JOptionPane.showMessageDialog(
                    this,
                    ex.getMessage(),
                    "Invalid Data",
                    JOptionPane.WARNING_MESSAGE
                );
            }
        });

        setSize(900, 400);
        setLocationRelativeTo(null);
    }

    public static void main(String[] args)
    {
        SwingUtilities.invokeLater(() -> new EvergreenApp().setVisible(true));
    }

    private class ValidatingIntegerCellEditor extends DefaultCellEditor
    {
        private final boolean allowBlank;
        private final String fieldName;

        public ValidatingIntegerCellEditor(String fieldName, boolean allowBlank)
        {
            super(new JTextField());
            this.fieldName = fieldName;
            this.allowBlank = allowBlank;
        }

        @Override
        public boolean stopCellEditing()
        {
            String text = ((JTextField) getComponent()).getText().trim();

            if (allowBlank && text.isEmpty())
            {
                return super.stopCellEditing();
            }

            if (text.isEmpty())
            {
                JOptionPane.showMessageDialog(
                    EvergreenApp.this,
                    fieldName + " is required.",
                    "Invalid Input",
                    JOptionPane.WARNING_MESSAGE
                );
                return false;
            }

            try
            {
                int value = Integer.parseInt(text);

                if (value < 0)
                {
                    JOptionPane.showMessageDialog(
                        EvergreenApp.this,
                        fieldName + " must be 0 or greater.",
                        "Invalid Input",
                        JOptionPane.WARNING_MESSAGE
                    );
                    return false;
                }
            }
            catch (NumberFormatException ex)
            {
                JOptionPane.showMessageDialog(
                    EvergreenApp.this,
                    fieldName + " must be a whole number.",
                    "Invalid Input",
                    JOptionPane.WARNING_MESSAGE
                );
                return false;
            }

            return super.stopCellEditing();
        }

        @Override
        public Object getCellEditorValue()
        {
            String text = ((JTextField) getComponent()).getText().trim();

            if (allowBlank && text.isEmpty())
            {
                return null;
            }

            return Integer.parseInt(text);
        }

        @Override
        public Component getTableCellEditorComponent(
            JTable table, Object value, boolean isSelected, int row, int column)
        {
            JTextField field = (JTextField) super.getTableCellEditorComponent(
                table, value, isSelected, row, column);

            field.setText(value == null ? "" : value.toString());
            return field;
        }
    }

    private static class CropTableModel extends AbstractTableModel
    {
        private final String[] cols = { "Name", "Season", "Amount", "Avg Days" };

        private final Class<?>[] types =
        {
            String.class, Season.class, Integer.class, Integer.class
        };

        List<Crop> data = new ArrayList<>();

        public void add(Crop c)
        {
            data.add(c);
            fireTableRowsInserted(data.size() - 1, data.size() - 1);
        }

        public void remove(int row)
        {
            data.remove(row);
            fireTableRowsDeleted(row, row);
        }

        public void setAll(List<Crop> list)
        {
            data.clear();
            data.addAll(list);
            fireTableDataChanged();
        }

        @Override
        public int getRowCount()
        {
            return data.size();
        }

        @Override
        public int getColumnCount()
        {
            return cols.length;
        }

        @Override
        public String getColumnName(int col)
        {
            return cols[col];
        }

        @Override
        public Class<?> getColumnClass(int col)
        {
            return types[col];
        }

        @Override
        public Object getValueAt(int row, int col)
        {
            Crop c = data.get(row);

            switch (col)
            {
                case 0:
                    return c.getName();
                case 1:
                    return c.getSeason();
                case 2:
                    return c.getCurrentAmount();
                case 3:
                    return c.getManualAvgCropPeriodDays();
                default:
                    return null;
            }
        }

        @Override
        public boolean isCellEditable(int row, int col)
        {
            return true;
        }

        @Override
        public void setValueAt(Object value, int row, int col)
        {
            Crop c = data.get(row);

            try
            {
                switch (col)
                {
                    case 0:
                    {
                        String newName = value == null ? "" : value.toString().trim();
                        c.setName(newName);
                        break;
                    }
                    case 1:
                    {
                        if (!(value instanceof Season))
                        {
                            throw new IllegalArgumentException("Invalid season.");
                        }

                        c.setSeason((Season) value);
                        break;
                    }
                    case 2:
                    {
                        int newAmount = parseRequiredNonNegativeInt(value, "Amount");
                        c.setCurrentAmount(newAmount);
                        break;
                    }
                    case 3:
                    {
                        Integer newAvgDays = parseOptionalNonNegativeInt(value, "Avg Days");
                        c.setManualAvgCropPeriodDays(newAvgDays);
                        break;
                    }
                    default:
                        return;
                }

                fireTableCellUpdated(row, col);
            }
            catch (IllegalArgumentException ex)
            {
                JOptionPane.showMessageDialog(
                    null,
                    ex.getMessage(),
                    "Invalid Input",
                    JOptionPane.WARNING_MESSAGE
                );
            }
        }

        private int parseRequiredNonNegativeInt(Object value, String fieldName)
        {
            if (value == null)
            {
                throw new IllegalArgumentException(fieldName + " is required.");
            }

            String text = value.toString().trim();

            if (text.isEmpty())
            {
                throw new IllegalArgumentException(fieldName + " is required.");
            }

            try
            {
                int parsed = Integer.parseInt(text);

                if (parsed < 0)
                {
                    throw new IllegalArgumentException(fieldName + " must be 0 or greater.");
                }

                return parsed;
            }
            catch (NumberFormatException ex)
            {
                throw new IllegalArgumentException(fieldName + " must be a whole number.");
            }
        }

        private Integer parseOptionalNonNegativeInt(Object value, String fieldName)
        {
            if (value == null)
            {
                return null;
            }

            String text = value.toString().trim();

            if (text.isEmpty())
            {
                return null;
            }

            try
            {
                int parsed = Integer.parseInt(text);

                if (parsed < 0)
                {
                    throw new IllegalArgumentException(fieldName + " must be 0 or greater.");
                }

                return parsed;
            }
            catch (NumberFormatException ex)
            {
                throw new IllegalArgumentException(fieldName + " must be a whole number.");
            }
        }
    }
}
