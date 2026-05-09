module.exports = async function handler(_req, res) {
  const catFacts = [
    "猫咪的胡须长度通常和它身体宽度接近，用来判断能不能钻过狭小空间。",
    "猫咪发出咕噜声不只代表开心，也可能是在自我安抚。",
    "家猫一天能睡 12 到 16 个小时，是典型的睡眠高手。",
    "猫咪耳朵可以独立转动，帮助它快速定位声音来源。",
    "猫咪鼻纹和人类指纹一样，每只都独一无二。"
  ];

  const dogFacts = [
    "狗狗的嗅觉大约是人类的数十倍到上百倍，非常擅长气味追踪。",
    "狗狗通过尾巴摆动的方向和幅度表达情绪与意图。",
    "狗狗的爪垫可以帮助它们在不同地面上减震和防滑。",
    "狗狗能听到比人类更高频率的声音，所以更容易注意到细微动静。",
    "很多狗狗会通过打哈欠来缓解紧张，这是一种社交信号。"
  ];

  const isCat = Math.random() < 0.5;
  const animal = isCat ? "猫猫" : "狗狗";
  const facts = isCat ? catFacts : dogFacts;
  const fact = facts[Math.floor(Math.random() * facts.length)];

  res.status(200).json({ animal, fact });
};
