import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storySource = readFileSync(new URL("../src/data/founder-story.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../src/customer-pages/AboutPage.tsx", import.meta.url), "utf8");

test("founder education uses the requested Master / Class terminology", () => {
  assert.match(storySource, /Master \/ Class Diplomas/);
  assert.match(storySource, /Master \/ Class Diploma programmes/);
  assert.doesNotMatch(storySource, /Masterclass Diplomas|masterclass diplomas|Master Class Diplomas/i);
});

test("founder education represents Cyberjaya study as continuing and includes the supplied subject areas", () => {
  assert.match(storySource, /University of Cyberjaya, Malaysia/);
  assert.match(storySource, /Currently pursuing/);
  assert.match(storySource, /pharmaceutical-related faculty/);
  assert.match(storySource, /Advanced shampoo technology/);
  assert.match(storySource, /Lipstick & colour-cosmetic technology/);
  assert.match(storySource, /Advanced cosmetic manufacturing concepts/);
  assert.match(storySource, /Cosmetic formulation & formulation development/);
  assert.doesNotMatch(storySource, /graduated from (the )?University of Cyberjaya/i);
});

test("founder education preserves supporting institutions and adds MIYC cosmetology", () => {
  for (const institution of ["Novella Global", "Sunflower Skills Academy", "Aromaflare Academy", "AIKA", "MIYC, Malaysia"])
    assert.match(storySource, new RegExp(institution));
  assert.match(storySource, /Cosmetology Studies/);
  assert.match(storySource, /professional treatment knowledge/);
});

test("Rajasthan and Kerala stories describe applied manufacturing knowledge without absolute exclusivity claims", () => {
  assert.match(storySource, /Rajasthan, India — Specialised Herbal Soap Formulation/);
  assert.match(storySource, /herbal soap formulation and manufacturing/);
  assert.match(storySource, /YARA’s approach to treatment-soap formulation/);
  assert.match(storySource, /Certain formulation details remain confidential/);
  assert.match(storySource, /Kerala, India — Ayurvedic Decoctions & Herbal Manufacturing/);
  assert.match(storySource, /preparation and manufacturing of traditional herbal decoctions/);
  assert.match(storySource, /extraction and preparation principles/);
  assert.doesNotMatch(storySource, /no one in Asia|never taught anywhere in Asia|only YARA has|nobody has ever implemented|only formula in Sri Lanka/i);
});

test("About renderer consumes the centralized editorial education model", () => {
  assert.match(pageSource, /founderStory\.education\.university/);
  assert.match(pageSource, /founderStory\.education\.rajasthan/);
  assert.match(pageSource, /founderStory\.education\.kerala/);
  assert.match(pageSource, /founderStory\.education\.professionalLearning/);
  assert.match(pageSource, /founderStory\.education\.synthesis/);
  assert.match(pageSource, /aria-labelledby="knowledge-formulation-title"/);
  assert.doesNotMatch(pageSource, /University of Cyberjaya, Malaysia|Rajasthan, India —|Kerala, India —|MIYC, Malaysia/);
});
