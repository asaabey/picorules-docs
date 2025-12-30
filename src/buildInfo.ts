// Build information
// Format: Build {year}.{month}.{auto-incremental-number}

export const BUILD_INFO = {
  year: 2025,
  month: 1,
  build: 1,
};

export const getBuildNumber = (): string => {
  return `Build ${BUILD_INFO.year}.${BUILD_INFO.month}.${BUILD_INFO.build}`;
};
