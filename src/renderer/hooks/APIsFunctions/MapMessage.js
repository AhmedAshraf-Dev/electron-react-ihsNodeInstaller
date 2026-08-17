export const mapMessage = (message, input) => {
  // Regex to match: Field{key}:D{default}
  const pattern = /Field\{([^}]+)\}(?::D\{([^}]+)\})?/g;

  const result = message.replace(pattern, (_, key, defaultValue) => {
    const value = input[key];
    return value !== undefined && value !== null
      ? String(value)
      : (defaultValue ?? "");
  });

  return result;
};
