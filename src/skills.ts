// Core skills
import coreSecuritySkill from "../skills/core/security/SKILL.md";
import coreWalletSkill from "../skills/core/wallet/SKILL.md";
// Market skills
import polymarketHeartbeat from "../skills/markets/polymarket/HEARTBEAT.md";
import polymarketSkill from "../skills/markets/polymarket/SKILL.md";
// Root skills
import rootHeartbeat from "../skills/HEARTBEAT.md";
import rootSkill from "../skills/SKILL.md";

export const skillsMap: Record<string, string> = {
    "/skills/core/security/SKILL.md": coreSecuritySkill,
    "/skills/core/wallet/SKILL.md": coreWalletSkill,
    "/skills/markets/polymarket/HEARTBEAT.md": polymarketHeartbeat,
    "/skills/markets/polymarket/SKILL.md": polymarketSkill,
    "/skills/HEARTBEAT.md": rootHeartbeat,
    "/skills/SKILL.md": rootSkill,
};
