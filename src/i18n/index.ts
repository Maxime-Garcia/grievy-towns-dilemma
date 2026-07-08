import { FR } from './fr';
import { EN } from './en';
import type { Item, Skill, Enemy, Quest, NPC, DialogueLine } from '../types';
import type { BestiaryEnemyData } from '../data/bestiary';

export type Lang = 'fr' | 'en';

const STORAGE_KEY = 'gtd_lang';

let currentLang: Lang = ((localStorage.getItem(STORAGE_KEY) ?? 'fr') as Lang);

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
}

// Internal lookup that returns `undefined` (not the raw key) on a full miss, so
// callers can chain `?? someFallback` and actually reach that fallback. `t()` below
// deliberately returns the key itself as a last resort for raw UI strings (where
// showing the key is an acceptable/visible "missing translation" signal) — but every
// localize* helper below wants to fall through to the underlying data's own field
// instead, and `t(key) || fallback` can never do that since `t()` never returns falsy.
function lookup(key: string): string | undefined {
  const dict = currentLang === 'en' ? EN : FR;
  return dict[key] ?? FR[key];
}

export function t(key: string): string {
  return lookup(key) ?? key;
}

// ── Localization helpers ─────────────────────────────────────

export function localizeItem(item: Item): { name: string; description: string; lore?: string } {
  return {
    name:        lookup(`item.${item.id}.name`)        ?? item.name,
    description: lookup(`item.${item.id}.description`) ?? item.description,
    lore:        lookup(`item.${item.id}.lore`)        ?? item.lore,
  };
}

export function localizeSkill(skill: Skill): { name: string; description: string } {
  return {
    name:        lookup(`skill.${skill.id}.name`)        ?? skill.name,
    description: lookup(`skill.${skill.id}.description`) ?? skill.description,
  };
}

export function localizeEnemy(enemy: Enemy): { name: string } {
  return {
    name: lookup(`enemy.${enemy.id}.name`) ?? enemy.name,
  };
}

export function localizeQuest(quest: Quest): { name: string } {
  return {
    name: lookup(`quest.${quest.id}.name`) ?? quest.name,
  };
}

export function localizeNPC(npc: NPC): { name: string } {
  return {
    name: lookup(`npc.${npc.id}.name`) ?? npc.name,
  };
}

export function localizeBestiaryEntry(entry: BestiaryEnemyData): { name: string; shortDesc: string; lore: string } {
  return {
    name:      lookup(`enemy.${entry.enemyId}.name`)         ?? entry.name,
    shortDesc: lookup(`bestiary.${entry.enemyId}.shortDesc`) ?? entry.shortDesc,
    lore:      lookup(`bestiary.${entry.enemyId}.lore`)      ?? entry.lore,
  };
}

/** Dialogue line text was previously hardcoded English in npcs.ts with no i18n keys
 * at all — this looks up `dialogue.<npcId>.<lineId>` / `.choice.<index>`, falling back
 * to the raw (English) text so unconfigured lines still render instead of breaking. */
export function localizeDialogueLine(npcId: string, line: DialogueLine): DialogueLine {
  return {
    ...line,
    text: lookup(`dialogue.${npcId}.${line.id}`) ?? line.text,
    choices: line.choices?.map((choice, i) => ({
      ...choice,
      text: lookup(`dialogue.${npcId}.${line.id}.choice.${i}`) ?? choice.text,
    })),
  };
}
