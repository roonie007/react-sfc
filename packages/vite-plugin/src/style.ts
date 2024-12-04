const styleRegex = /<style(?:\s+lang="[^"]*")?>([\s\S]*?)<\/style>/gim;

export const styleLang = (code: string) => {
  const match = code.match(/[\s]lang=["'](css|scss|less|stylus)["']/i);
  if (!match) {
    return 'css';
  }

  return match[1];
};

export const extractStyles = (code: string) => {
  const result = code.matchAll(styleRegex) || [];
  if (!result) {
    return;
  }

  return result.toArray().map(t => ({ style: t[1], lang: styleLang(t[0]) }));
};

export default (code: string) => {
  const styles = extractStyles(code);

  return styles || [];
};
