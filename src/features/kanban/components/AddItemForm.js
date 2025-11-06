import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const defaultForm = {
  name: '',
  owner: '',
  priority: '',
  notes: ''
};

const AddItemForm = React.memo(function AddItemForm({ onSubmit }) {
  const [form, setForm] = useState(defaultForm);

  const updateField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      return;
    }
    onSubmit({ ...form });
    setForm(defaultForm);
  }, [form, onSubmit]);

  const handlers = useMemo(
    () => ({
      name: (value) => updateField('name', value),
      owner: (value) => updateField('owner', value),
      priority: (value) => updateField('priority', value),
      notes: (value) => updateField('notes', value)
    }),
    [updateField]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuovo elemento</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <Label text="Titolo" />
          <Field value={form.name} onChangeText={handlers.name} placeholder="Obiettivo" />
        </View>
        <View style={styles.half}>
          <Label text="Responsabile" />
          <Field value={form.owner} onChangeText={handlers.owner} placeholder="Team" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Label text="Priorità" />
          <Field value={form.priority} onChangeText={handlers.priority} placeholder="Alta" />
        </View>
        <View style={styles.half}>
          <Label text="Note" />
          <Field
            value={form.notes}
            onChangeText={handlers.notes}
            placeholder="Dettagli aggiuntivi"
            multiline
          />
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={handleSubmit} style={styles.submit}>
        <Text style={styles.submitLabel}>Aggiungi</Text>
      </Pressable>
    </View>
  );
});

AddItemForm.propTypes = {
  onSubmit: PropTypes.func.isRequired
};

const Label = React.memo(function Label({ text }) {
  return <Text style={styles.label}>{text}</Text>;
});

Label.propTypes = {
  text: PropTypes.string.isRequired
};

const Field = React.memo(function Field({ value, onChangeText, placeholder, multiline }) {
  return (
    <TextInput
      style={[styles.field, multiline && styles.multiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#4b5565"
      multiline={multiline}
    />
  );
});

Field.propTypes = {
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  multiline: PropTypes.bool
};

Field.defaultProps = {
  placeholder: '',
  multiline: false
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(18, 24, 38, 0.7)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#263046',
    padding: 16,
    marginBottom: 16
  },
  title: {
    color: '#e6edf3',
    fontWeight: '700',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    columnGap: 12,
    marginBottom: 12
  },
  half: {
    flex: 1
  },
  label: {
    color: '#9aa4b2',
    fontSize: 13,
    marginBottom: 4
  },
  field: {
    backgroundColor: '#0b1324',
    borderColor: '#263046',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e6edf3'
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  submit: {
    alignSelf: 'flex-end',
    backgroundColor: '#5eead4',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  submitLabel: {
    color: '#061317',
    fontWeight: '700'
  }
});

export default AddItemForm;
