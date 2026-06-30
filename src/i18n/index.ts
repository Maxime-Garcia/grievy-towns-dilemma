import { FR } from './fr';
import { EN } from './en';
import type { Item, Skill, Enemy, Quest, NPC } from '../types';

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

export function t(key: string): string {
  const dict = currentLang === 'en' ? EN : FR;
  return dict[key] ?? FR[key] ?? key;
}

// ── Localization helpers ─────────────────────────────────────

export function localizeItem(item: Item): { name: string; description: string } {
  return {
    name:        t(`item.${item.id}.name`)        || item.name,
    description: t(`item.${item.id}.description`) || item.description,
  };
}

export function localizeSkill(skill: Skill): { name: string; description: string } {
  return {
    name:        t(`skill.${skill.id}.name`)        || skill.name,
    description: t(`skill.${skill.id}.description`) || skill.description,
  };
}

export function localizeEnemy(enemy: Enemy): { name: string } {
  return {
    name: t(`enemy.${enemy.id}.name`) || enemy.name,
  };
}

export function localizeQuest(quest: Quest): { name: string } {
  return {
    name: t(`quest.${quest.id}.name`) || quest.name,
  };
}

export function localizeNPC(npc: NPC): { name: string } {
  return {
    name: t(`npc.${npc.id}.name`) || npc.name,
  };
}
