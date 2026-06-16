import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, ViewStyle, TextInputProps } from 'react-native';
import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '../theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  containerStyle?: ViewStyle;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  icon: Icon,
  error,
  containerStyle,
  secureTextEntry,
  placeholder,
  value,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isSecure = secureTextEntry && !passwordVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error ? styles.inputContainerError : null,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={isSecure}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...props}
        />
        
        {secureTextEntry ? (
          <Pressable
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.iconContainer}
          >
            {passwordVisible ? (
              <EyeOff size={20} color={COLORS.textSecondary} />
            ) : (
              <Eye size={20} color={COLORS.textSecondary} />
            )}
          </Pressable>
        ) : Icon ? (
          <View style={styles.iconContainer}>
            <Icon size={20} color={COLORS.textSecondary} />
          </View>
        ) : null}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  iconContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    paddingLeft: 4,
  },
});
