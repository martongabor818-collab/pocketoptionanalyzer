import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthValidatorProps {
  password: string;
  onValidityChange: (isValid: boolean) => void;
}

interface PasswordRule {
  test: (password: string) => boolean;
  message: string;
}

const passwordRules: PasswordRule[] = [
  {
    test: (password: string) => password.length >= 8,
    message: 'At least 8 characters'
  },
  {
    test: (password: string) => /[a-z]/.test(password),
    message: 'Contains lowercase letter'
  },
  {
    test: (password: string) => /[A-Z]/.test(password),
    message: 'Contains uppercase letter'
  },
  {
    test: (password: string) => /\d/.test(password),
    message: 'Contains number'
  },
  {
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    message: 'Contains special character'
  }
];

export const PasswordStrengthValidator: React.FC<PasswordStrengthValidatorProps> = ({ 
  password, 
  onValidityChange 
}) => {
  const results = passwordRules.map(rule => ({
    ...rule,
    passed: rule.test(password)
  }));

  const allPassed = results.every(result => result.passed);
  
  React.useEffect(() => {
    onValidityChange(allPassed);
  }, [allPassed, onValidityChange]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm font-medium text-muted-foreground mb-2">Password requirements:</p>
      {results.map((result, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          {result.passed ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <X className="w-3 h-3 text-red-500" />
          )}
          <span className={result.passed ? 'text-green-500' : 'text-red-500'}>
            {result.message}
          </span>
        </div>
      ))}
    </div>
  );
};