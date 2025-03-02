这个项目最初基于 [mpMath 公式一键转换](https://github.com/latentcat/mpmath/pull/6) 构建, 但随着微信公众号基于 ProseMirror 的新编辑器的推出, 原插件所有功能基本上都失效了, 因为她们都是基于 ueditor 接口实现的. 本项目将笔者需要的功能, 即 '公式一键转换' 单独抽了出来, 基于 ProseMirror 接口进行了重新实现, 细节见 [mpMath: 与微信公众号的斗智之旅(2)](https://blog.hidva.com/2025/03/02/wechat-mpmath-2/).

使用姿势:
1. 像往常一样安装插件.
2. 控制台输入 `HidvaMpMathGo()`! 或许可以加个按钮啥的.
