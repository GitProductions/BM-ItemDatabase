type AggroLevel = 'mild' | 'medium' | 'high' | 'savage';

type OrcPhraseCategory = Partial<Record<AggroLevel, string[]>> & {
  allLevels?: string[];
};

const orcPhrases = {
  noSearchResults: {
    // When search returns 0 items
    mild: [
      "A half-orc grunts: 'Nothin' here. Try harder.'",
      "The half-orc shrugs: 'Ain't seein' what yer lookin' fer. Keep searchin'.'",
      "Half-orc mutters: 'Empty. Maybe ya spelled it wrong, soft-skin.'",
    ],
    medium: [
      "A burly half-orc snarls: 'Ya lookin' fer ghosts? Ain't nothin' there!'",
      "The half-orc barks: 'No dice. Stop wastin' me time with bad words.'",
      "Half-orc growls: 'Nothin' matches that rubbish. Try again or get lost.'",
    ],
    high: [
      "The half-orc spits: 'Yer search is garbage! Fix it or shove off!'",
      "A scarred half-orc roars: 'What kinda weak query is that? Try bein' useful!'",
      "Half-orc snarls: 'Empty handed again? Ya call that searchin'? Pathetic!'",
    ],
    savage: [
      "The half-orc slams his fist: 'Yer words are trash! I oughta smash yer face!'",
      "Half-orc bellows: 'No results? Good! Means yer too stupid fer me database!'",
      "A raging half-orc screams: 'Search like that again and I'll feed ya to the pigs!'",
    ],
  },

  noIdentifyInfo: {
    // When user tries to submit/suggest without identify output
    mild: [
      "A half-orc grumbles: 'No identify scroll? Can't help ya then.'",
      "The half-orc points: 'Identify it first, then talk to me.'",
      "Half-orc shrugs: 'Dunno what it does. Identify it, git.'",
    ],
    medium: [
      "A half-orc snarls: 'Ya expect me to guess? Identify that junk first!'",
      "The half-orc growls: 'No identify output? No deal. Go rub some magic on it.'",
      "Half-orc barks: 'Identify it proper or stop wastin' me breath!'",
    ],
    high: [
      "The half-orc leans in: 'No identify? Then shut yer trap or I'll shut it for ya!'",
      "Half-orc spits: 'Identify dat thing or I'll identify yer skull wit' me axe!'",
      "A furious half-orc roars: 'Ya come here empty-handed? Identify it NOW!'",
    ],
    savage: [
      "The half-orc grabs your collar: 'No identify? I'll identify yer guts on the floor!'",
      "Half-orc screams: 'Ya dare submit dat without knowin' what it is?! Die!'",
      "A berserk half-orc howls: 'No identify = no mercy! Prepare to bleed!'",
    ],
  },

  invalidSubmission: {
    // When submission fails (bad data, server error, etc.)
    mild: [
      "Half-orc grunts: 'Somethin' broke. Try again later.'",
      "The half-orc shrugs: 'That didn't work. Fix yer mess.'",
      "Half-orc mutters: 'Failed. Not my problem.'",
    ],
    medium: [
      "A half-orc snarls: 'Yer submission's trash! Try not suckin' next time.'",
      "The half-orc growls: 'Failed. Probably yer fault. Fix it.'",
      "Half-orc barks: 'That blew up. Do better.'",
    ],
    high: [
      "The half-orc roars: 'Yer junk broke the system! Get it right!'",
      "Half-orc spits: 'Submission failed 'cause yer stupid! Retry!'",
      "A angry half-orc bellows: 'Ya broke it! Fix yer garbage input!'",
    ],
    savage: [
      "The half-orc smashes the table: 'Yer submission failed?! I'll make ya fail permanently!'",
      "Half-orc screams: 'Broken?! I'll break YOU next!'",
      "A raging half-orc howls: 'Failed submission = failed life! Prepare to die!'",
    ],
  },

  // Reset confirmation dialog phrases
  resetConfirmation: {
    mild: [
      "Half-orc grunts: 'You really mean to burn it all down, eh?'",
      "The half-orc asks: 'This gonna wipe everything? You sure?'",
      "Half-orc mutters: 'This is serious. You sure about reset?'",
    ],
    medium: [
      "A half-orc snarls: 'You really wanna scrap all that work? Think twice!'",
      "The half-orc growls: 'Resettin' means losin' it all! You sure about that?'",
      "Half-orc barks: 'This ain't no joke! You sure you wanna reset everything?'",
    ],
    high: [
      "The half-orc roars: 'You wanna throw it all away?! You better be damn sure!'",
      "Half-orc spits: 'Resettin' means startin' from scratch! You sure you want that?'",
      "A furious half-orc bellows: 'You wanna lose it all?! You better be real sure!'",
    ],
    savage: [
      "The half-orc slams his fist: 'You wanna erase everythin'?! You better be damn well sure!'",
      "Half-orc screams: 'You wanna wipe the slate clean?! You better be REALLY sure!'",
    ],
  },

  // create new gear profile dialog phrases
  newProfilePrompt: {
    mild: [
      "Half-orc grunts: 'Gonna name this new thing, eh?'",
      "The half-orc asks: 'What you callin' this new set?'",
      "Half-orc mutters: 'New profile needs a name. What is it?'",
    ],
    medium: [
      "A half-orc snarls: 'You makin' a new set? Better give it a name!'",
      "The half-orc growls: 'New gear profile needs a name! What you pickin?'",
      "Half-orc barks: 'You creatin' a new set? You better name it!'",
    ],
    high: [
      "Half-orc spits: 'New gear set needs a name! What you callin' it?'",
      "A furious half-orc bellows: 'You creatin' a new set?! You better name it right!'",
    ],
    savage: [
      "The half-orc slams his fist: 'You makin' a new profile?! You better give it a name or I'll name it for ya!'",
      "Half-orc screams: 'New gear set needs a name! You better pick somethin' good or else!'",
    ],
  },

  genericGrumpy: {
    // Random fallback or loading states
    allLevels: [
      "Half-orc grunts: 'What now?'",
      "The half-orc glares: 'Make it quick.'",
      "Half-orc growls: 'Better be good.'",
      "A half-orc snarls: 'Spit it out already!'",
      "The half-orc roars: 'Talk or get smashed!'",
    ],
  },
} satisfies Record<string, OrcPhraseCategory>;

export const getRandomOrcPhrase = (
  scenario: keyof typeof orcPhrases,
  aggression: 'random' | AggroLevel = 'medium',
) => {
  const category = orcPhrases[scenario];
  if (!category) return "A half-orc grunts: 'Somethin' ain't right.'";

  if (aggression === 'random') {
    const levels = Object.keys(category).filter((level) => level !== 'allLevels') as AggroLevel[];
    aggression = levels[Math.floor(Math.random() * levels.length)];
  }

  // Narrow category to a consistent shape so TS knows aggression is a valid key
  const normalized: Partial<Record<AggroLevel, string[]>> & { allLevels?: string[] } = category;

  const phrases = normalized[aggression] || normalized.allLevels || normalized.mild;
  if (!phrases?.length) return "A half-orc says: 'Huh?'";

  return phrases[Math.floor(Math.random() * phrases.length)];
};
