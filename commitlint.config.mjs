export default {
  extends: ["@commitlint/config-conventional"],
  // @see: https://commitlint.js.org/#/reference-rules
  rules: {
    "subject-case": [0], // subject大小写不做校验

    // 类型枚举，git提交type必须是以下类型
    "type-enum": [
      // 当前验证的错误级别
      2,
      // 在什么情况下进行验证
      "always",
      // 泛型内容
      [
        "feat", // 新功能 feature
        "fix", // 修复 bug
        "docs", // 文档注释
        "style", // 代码格式(不影响代码运行的变动)
        "refactor", // 重构(既不增加新功能，也不是修复bug)
        "perf", // 性能优化
        "test", // 增加测试
        "chore", // 构建过程或辅助工具的变动
        "revert", // 回退
        "build", // 打包
        "ci", // CI/CD相关
      ],
    ],
    // subject长度限制
    "subject-max-length": [2, "always", 72],
    // body长度限制
    "body-max-line-length": [2, "always", 100],
    // footer长度限制
    "footer-max-line-length": [2, "always", 100],
    // header长度限制
    "header-max-length": [2, "always", 100],
  },
  prompt: {
    messages: {
      type: "选择你要提交的类型 :",
      scope: "选择一个提交范围（可选）:",
      customScope: "请输入自定义的提交范围 :",
      subject: "填写简短精炼的变更描述 :",
      body: "填写更加详细的变更描述（可选）。使用 '|' 换行 :",
      breaking: "列举非兼容性重大的变更（可选）。使用 '|' 换行 :",
      footerPrefixSelect: "选择关联issue前缀（可选）:",
      customFooterPrefix: "输入自定义issue前缀 :",
      footer: "列举关联issue（可选）例如: #31, #I3244 :",
      confirmCommit: "是否提交或修改commit ?",
    },
    types: [
      {
        value: "feat",
        name: "feat:     ✨  新增功能 | A new feature",
        emoji: "✨",
      },
      {
        value: "fix",
        name: "fix:      🐛  修复缺陷 | A bug fix",
        emoji: "🐛",
      },
      {
        value: "docs",
        name: "docs:     📝  文档更新 | Documentation only changes",
        emoji: "📝",
      },
      {
        value: "style",
        name: "style:    💄  代码格式 | Changes that do not affect the meaning of the code",
        emoji: "💄",
      },
      {
        value: "refactor",
        name: "refactor: ♻️   代码重构 | A code change that neither fixes a bug nor adds a feature",
        emoji: "♻️",
      },
      {
        value: "perf",
        name: "perf:     ⚡️  性能提升 | A code change that improves performance",
        emoji: "⚡️",
      },
      {
        value: "test",
        name: "test:     ✅  测试相关 | Adding missing tests or correcting existing tests",
        emoji: "✅",
      },
      {
        value: "build",
        name: "build:    📦️  构建相关 | Changes that affect the build system or external dependencies",
        emoji: "📦️",
      },
      {
        value: "ci",
        name: "ci:       🎡  持续集成 | Changes to our CI configuration files and scripts",
        emoji: "🎡",
      },
      {
        value: "revert",
        name: "revert:   ⏪️  回退代码 | Revert to a commit",
        emoji: "⏪️",
      },
      {
        value: "chore",
        name: "chore:    🔨  其他修改 | Other changes that don't modify src or test files",
        emoji: "🔨",
      },
    ],
    useEmoji: true,
    emojiAlign: "center",
    useAI: false,
    aiNumber: 1,
    themeColorCode: "",
    scopes: [],
    allowCustomScopes: true,
    allowEmptyScopes: true,
    customScopesAlign: "bottom",
    customScopesAlias: "custom",
    emptyScopesAlias: "empty",
    upperCaseSubject: false,
    markBreakingChangeMode: false,
    allowBreakingChanges: ["feat", "fix"],
    breaklineNumber: 100,
    breaklineChar: "|",
    skipQuestions: [],
    issuePrefixes: [
      { value: "closed", name: "closed:   ISSUES has been processed" },
    ],
    customIssuePrefixAlign: "top",
    emptyIssuePrefixAlias: "skip",
    customIssuePrefixAlias: "custom",
    allowCustomIssuePrefix: true,
    allowEmptyIssuePrefix: true,
    confirmColorize: true,
    scopeOverrides: undefined,
    defaultBody: "",
    defaultIssues: "",
    defaultScope: "",
    defaultSubject: "",
  },
};
