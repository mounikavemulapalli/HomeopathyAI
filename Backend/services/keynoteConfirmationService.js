
const { resolveCanonicalRemedyName } = require("./repertoryLoaderService.cjs");

const keynoteProfiles = {
  Pulsatilla: [
    "thirstless",
    "mild disposition",
    "weeping",
    "changeable symptoms",
    "better open air",
  ],
  Sulphur: [
    "burning sensation",
    "aggravation from heat",
    "morning diarrhea",
    "dirty looking skin",
    "uncleanliness",
  ],
  Lachesis: [
    "left-sided complaints",
    "constriction sensation",
    "aggravation after sleep",
    "jealousy",
    "loquacity",
  ],
  "Rhus toxicodendron": [
    "Restlessness with desire for movement",
    "Stiffness relieved by motion",
    "Complaints after getting wet or overexertion",
    "Skin eruptions with intense itching",
    "Worse from initial motion, better continued motion"
  ],  "Arsenicum album": [
    "fear of death",
    "restlessness",
    "burning pains",
    "fastidious",
    "thirst for small quantities",
  ],
  "Nux vomica": [
    "irritable",
    "impatient",
    "overwork",
    "sedentary lifestyle",
    "aggravation from mental exertion",
  ],
  "Calcarea carb": [
    "cold, damp feet",
    "sour perspiration",
    "craving for indigestible things",
    "anxiety about health",
    "difficulty losing weight",
  ],
  Sepia: [
    "indifference to loved ones",
    "sinking sensation in stomach",
    "bearing down sensation",
    "aggravation before menses",
    "chilly, yet dislikes heat",
  ],
  Lycopodium: [
    "right-sided complaints",
    "aggravation 4-8 PM",
    "flatulence",
    "lack of self-confidence",
    "craving for sweets",
  ],
  Phosphorus: [
    "tall, slender, stooping",
    "burning pains, relieved by cold",
    "great thirst for cold drinks",
    "sympathetic",
    "fear of thunderstorms",
  ],
  "Natrum muriaticum": [
    "grief, prolonged",
    "craving for salt",
    "aggravation from consolation",
    "headaches like hammer blows",
    "dryness of mucous membranes",
    "marked sensitivity with reserved emotional state",
    "headache with periodic or hammering pain",
    "symptoms aggravated by sun and emotional stress",
  ],
  "Chamomilla": [
    "violent irritability",
    "oversensitivity to pain",
    "anger and impatience",
    "restlessness",
    "better when carried"
  ],
  "Conium maculatum": [
    "hard glandular swellings",
    "vertigo when turning in bed",
    "weakness and sluggishness",
    "worse from motion",
    "sexual weakness"
  ],
    "Abies canadensis": [
    "sensation of a lump in stomach",
    "hungry soon after eating",
    "heavy pressure in stomach",
    "pain in upper chest with gastric symptoms",
    "sensation of something pressing upward in stomach",
  ],

  "Abies nigra": [
    "sensation of a hard boiled egg in stomach",
    "constant sensation of a lump in stomach",
    "gastric symptoms after eating",
    "pain in stomach with eructations",
    "worse after eating",
  ],

  Abrotanum: [
    "emaciation with ravenous appetite",
    "marasmus with wasting of lower limbs",
    "rheumatic complaints alternating with diarrhoea",
    "metastasis of rheumatism to heart",
    "gouty or rheumatic complaints after suppressed discharge",
  ],

  Absinthium: [
    "violent nervous excitement",
    "hallucinations and frightful visions",
    "tremors before epileptiform attacks",
    "vertigo with tendency to fall backward",
    "sleeplessness with nervous excitement",
  ],

  "Acalypha indica": [
    "violent burning in chest",
    "bright red blood from respiratory passages",
    "hemoptysis with burning in chest",
    "morning aggravation of cough",
    "dry hacking cough with burning sensation",
  ],

  "Acetic acid": [
    "great emaciation with weakness",
    "intense thirst with profuse urination",
    "burning pains",
    "pale waxy appearance with debility",
    "sour or acid discharges",
  ],

  "Aconitum cammarum": [
    "violent neuralgic pains",
    "numbness and tingling with neuralgic symptoms",
    "restlessness with nervous excitement",
    "sharp shooting pains",
    "aggravation from slight movement",
  ],

  "Aconitum ferox": [
    "intense neuralgic pains",
    "violent burning sensations",
    "great anxiety with respiratory distress",
    "oppressive dyspnoea",
    "sensation of impending suffocation",
  ],

  "Aconitum lycoctonum": [
    "neuralgic pains with numbness",
    "violent tearing pains",
    "pain extending along nerves",
    "numbness with tingling",
    "aggravation from movement",
  ],

  "Aconitum napellus": [
    "sudden violent complaints after fright",
    "great fear of death",
    "marked restlessness and anxiety",
    "burning or tingling sensations",
    "acute complaints after exposure to cold dry wind",
  ],

  "Actaea spicata": [
    "rheumatic pains in small joints",
    "great tenderness of joints",
    "wrist and finger joints especially affected",
    "pain aggravated by slightest motion",
    "swelling and stiffness of small joints",
  ],

  "Aesculus glabra": [
    "venous congestion",
    "hemorrhoidal tendency",
    "fullness and heaviness in pelvis",
    "backache with pelvic congestion",
    "burning and itching in rectum",
  ],

  "Aesculus hippocastanum": [
    "hemorrhoids with marked venous congestion",
    "sensation of fullness in rectum",
    "severe lumbo-sacral backache",
    "rectal dryness and burning",
    "backache worse from walking and stooping",
  ],
    "Aethusa cynapium": [
    "violent vomiting with inability to retain food or milk",
    "intolerance of milk",
    "drowsiness after vomiting",
    "great prostration after vomiting",
    "sudden weakness with cerebral symptoms",
  ],

  "Agaricus emeticus": [
    "violent vomiting with gastric irritation",
    "burning in stomach",
    "nausea with retching",
    "great weakness after vomiting",
    "gastrointestinal irritation with nervous symptoms",
  ],

  "Agaricus phalloides": [
    "violent gastroenteritis with vomiting and diarrhoea",
    "great prostration",
    "coldness and collapse",
    "profuse watery diarrhoea",
    "severe abdominal pain with vomiting",
  ],

  "Agaricus muscarius": [
    "twitching and jerking of muscles",
    "chorea-like involuntary movements",
    "great sensitivity to cold",
    "burning and itching with marked nervous symptoms",
    "symptoms worse before a thunderstorm",
  ],

  "Agnus castus": [
    "premature old age with marked weakness",
    "sexual weakness with loss of desire",
    "cold and relaxed genitals",
    "profound mental and physical exhaustion",
    "discharge with marked sexual debility",
  ],

  Ailanthus: [
    "great prostration with stupor",
    "dusky or livid appearance",
    "violent sore throat with difficulty swallowing",
    "typhoid-like state with delirium",
    "offensive discharges",
  ],

  Alcohol: [
    "violent craving for alcohol",
    "intoxication with mental excitement",
    "trembling with nervous weakness",
    "burning sensations in stomach",
    "great prostration after excessive alcohol",
  ],

  "Aletris farinosa": [
    "marked weakness with anaemia",
    "constant tiredness and lack of energy",
    "digestive weakness with constipation",
    "bearing-down sensation in pelvis",
    "uterine complaints with profound debility",
  ],

  "Allium cepa": [
    "watery acrid discharge from nose",
    "tears are bland while nasal discharge is acrid",
    "frequent sneezing with fluent coryza",
    "burning nasal discharge",
    "symptoms better in open air",
  ],

  "Allium sativum": [
    "marked digestive disturbance from unsuitable food",
    "burning in stomach and abdomen",
    "flatulence with abdominal distension",
    "rheumatic pains associated with digestive disturbance",
    "great thirst with gastric irritation",
  ],

  "Aloe socotrina": [
    "sudden urging to stool",
    "inability to trust the rectum to retain stool",
    "prolapse of rectum with stool",
    "early morning diarrhoea",
    "sensation of weight or fullness in pelvis",
  ],

  "Alstonia constricta": [
    "great weakness from malarial or intermittent fever",
    "marked prostration with digestive disturbance",
    "sensation as if stomach were weak or unable to digest",
    "debility with diarrhoea",
    "periodic fever with profound weakness",
  ],

  "Aluminium metallicum": [
    "marked dryness of mucous membranes",
    "constipation with no desire for stool",
    "slow passage of stool with great straining",
    "mental confusion with slow thought",
    "symptoms worse from potatoes",
  ],

  "Alumina silicata": [
    "marked weakness with nervous exhaustion",
    "dryness of mucous membranes",
    "obstinate constipation",
    "sluggish digestion with abdominal distension",
    "chilly state with great debility",
  ],

  Alumina: [
    "extreme dryness of mucous membranes",
    "constipation with no desire for stool",
    "stool requires great straining even when soft",
    "mental confusion and slow perception",
    "great weakness with heaviness of limbs",
  ],

  Alumen: [
    "obstinate constipation with dry hard stool",
    "great weakness with tendency to haemorrhage",
    "haemorrhoidal complaints",
    "dryness and constriction of mucous membranes",
    "marked sluggishness of intestinal function",
  ],
    "Ammonium benzoicum": [
    "rheumatic pains with marked urinary symptoms",
    "dark or offensive urine",
    "gouty or rheumatic complaints with renal involvement",
    "pain in joints with urinary disturbance",
    "aggravation from motion",
  ],

  "Ammonium bromatum": [
    "hoarseness with spasmodic cough",
    "dry irritating cough with laryngeal symptoms",
    "headache with nervous restlessness",
    "respiratory complaints with oppression",
    "worse at night",
  ],

  "Ammonium carbonicum": [
    "great weakness with shortness of breath",
    "sensitivity to cold air",
    "nosebleeds with congestive symptoms",
    "palpitation with anxiety",
    "respiratory complaints worse at night",
  ],

  "Ammonium causticum": [
    "burning pain in throat",
    "hoarseness with laryngeal irritation",
    "violent cough with burning in chest",
    "marked weakness with respiratory distress",
    "sensation of constriction in throat",
  ],

  "Ammonium muriaticum": [
    "marked weakness with aching limbs",
    "backache with stiffness",
    "cramping pains in calves",
    "constipation with hard stool",
    "respiratory complaints with thick mucus",
  ],

  "Ambra grisea": [
    "extreme embarrassment in presence of others",
    "cannot perform bodily functions when people are nearby",
    "marked nervous sensitivity",
    "insomnia from thoughts and excitement",
    "involuntary complaints from emotional excitement",
  ],

  "Ambrosia artemisiifolia": [
    "violent hay fever with sneezing",
    "profuse watery nasal discharge",
    "itching and burning of eyes",
    "seasonal respiratory allergy",
    "asthmatic symptoms associated with hay fever",
  ],

  "Amyl nitrite": [
    "sudden flushing of face",
    "violent throbbing headache",
    "sensation of heat with redness of face",
    "palpitations with vascular excitement",
    "symptoms brought on by emotional excitement",
  ],

  "Ammoniacum gummi": [
    "deep-seated bronchial congestion",
    "violent cough with thick expectoration",
    "oppression of chest",
    "difficulty raising mucus",
    "respiratory complaints with great fatigue",
  ],

  Amphisbœna: [
    "marked sensation of coldness",
    "rheumatic pains with wandering symptoms",
    "neuralgic pains with numbness",
    "pain aggravated by movement",
    "marked sensitivity of the nervous system",
  ],

  "Amygdalae amarae aqua": [
    "spasmodic cough with respiratory irritation",
    "nervous restlessness",
    "headache with gastric disturbance",
    "nausea with abdominal discomfort",
    "weakness following acute symptoms",
  ],

  "Anacardium occidentale": [
    "marked digestive disturbance",
    "burning pain in stomach",
    "abdominal complaints with weakness",
    "constipation with abdominal discomfort",
    "symptoms associated with nervous exhaustion",
  ],

  "Anacardium orientale": [
    "contradictory impulses and conflicting desires",
    "marked loss of memory",
    "sensation of two wills or opposing impulses",
    "cruel or violent impulses with internal conflict",
    "symptoms temporarily better from eating",
  ],

  "Anagallis arvensis": [
    "intense itching of palms and soles",
    "skin eruptions with itching",
    "burning and itching of hands",
    "rheumatic pains with skin symptoms",
    "symptoms aggravated by touch",
  ],

  "Anantherum muricatum": [
    "marked itching with skin eruptions",
    "offensive perspiration",
    "burning sensations of the skin",
    "digestive complaints with flatulence",
    "great weakness with nervous symptoms",
  ],

  "Angustura vera": [
    "violent spasmodic pains",
    "marked stiffness of muscles",
    "rheumatic pains with muscular soreness",
    "great irritability with nervous tension",
    "pain aggravated by motion",
  ],

  Anilinum: [
    "marked cyanosis with circulatory weakness",
    "headache with dizziness",
    "great weakness and prostration",
    "shortness of breath with bluish discoloration",
    "symptoms associated with impaired oxygenation",
  ],

  "Anisum stellatum": [
    "spasmodic cough with bronchial irritation",
    "flatulent abdominal complaints",
    "colicky pains with gas",
    "nausea with digestive disturbance",
    "nervous restlessness with digestive symptoms",
  ],

  "Antimonium arsenicosum": [
    "severe respiratory oppression",
    "dyspnoea with weakness of the heart",
    "chest symptoms with great prostration",
    "cyanotic appearance with respiratory distress",
    "marked cardiac and pulmonary weakness",
  ],
    "Antimonium crudum": [
    "thick white-coated tongue",
    "indigestion with marked gastric disturbance",
    "cracks and horny skin on hands and feet",
    "irritability with aversion to being touched",
    "symptoms worse from overeating",
  ],

  "Antimonium chloridum": [
    "marked gastric irritation",
    "nausea with vomiting",
    "burning pains in stomach",
    "respiratory complaints with thick mucus",
    "great weakness after acute illness",
  ],

  "Antimonium oxydatum": [
    "marked weakness with respiratory difficulty",
    "thick mucus in respiratory passages",
    "oppression of chest",
    "gastric disturbance with nausea",
    "great prostration",
  ],

  "Antimonium sulphuratum aureum": [
    "deep respiratory oppression",
    "thick yellow mucus in bronchial passages",
    "chronic catarrhal respiratory complaints",
    "burning sensation in chest",
    "dyspnoea with marked weakness",
  ],

  "Antimonium tartaricum": [
    "great rattling of mucus in chest",
    "difficulty bringing up expectoration",
    "marked dyspnoea with suffocation",
    "great prostration with respiratory distress",
    "drowsiness during severe respiratory attacks",
  ],

  "Anthemis nobilis": [
    "extreme irritability with hypersensitivity",
    "colicky abdominal pains",
    "teething complaints with restlessness",
    "violent spasmodic pains",
    "symptoms aggravated by touch",
  ],

  Anthracinum: [
    "burning pains with destructive tissue symptoms",
    "malignant-looking ulcers",
    "marked swelling with burning",
    "offensive discharges",
    "rapid tissue destruction",
  ],

  Anthrokokali: [
    "marked respiratory oppression",
    "burning sensations in chest",
    "chronic bronchial complaints",
    "great weakness with dyspnoea",
    "thick expectoration with respiratory difficulty",
  ],

  "Apium graveolens": [
    "violent itching of skin",
    "burning and stinging skin eruptions",
    "urinary irritation",
    "nervous restlessness with skin symptoms",
    "symptoms aggravated by touch",
  ],

  "Aphis chenopodii glauci": [
    "marked skin irritation with itching",
    "burning sensations of the skin",
    "eruptive complaints with intense itching",
    "digestive disturbance with abdominal discomfort",
    "nervous restlessness accompanying skin symptoms",
  ],

  "Apis mellifica": [
    "stinging pains with burning",
    "marked oedema and swelling",
    "great sensitivity to touch",
    "thirstlessness during acute complaints",
    "symptoms worse from heat and better from cold applications",
  ],

  "Apocynum androsaemifolium": [
    "violent gastric and intestinal disturbance",
    "nausea with vomiting",
    "diarrhoea with abdominal cramps",
    "great weakness after gastrointestinal symptoms",
    "burning pains in abdomen",
  ],

  "Apocynum cannabinum": [
    "marked oedema with dropsical swelling",
    "great thirst with scanty urine",
    "cardiac weakness with dropsy",
    "vomiting with inability to retain fluids",
    "great prostration with fluid retention",
  ],

  Apomorphium: [
    "persistent nausea with vomiting",
    "vomiting from slightest movement",
    "violent nausea with gastric irritation",
    "vertigo with nausea",
    "great weakness after vomiting",
  ],

  "Aralia racemosa": [
    "asthmatic attacks worse at night",
    "dry cough with tickling in throat",
    "asthma aggravated by lying down",
    "cough triggered by cold air",
    "respiratory symptoms with oppression of chest",
  ],

  "Aranea scinencia": [
    "marked periodicity of symptoms",
    "great chilliness with cold sensation",
    "neuralgic pains with numbness",
    "symptoms worse at definite hours",
    "extreme sensitivity to cold",
  ],

  "Aranea diadema": [
    "periodic neuralgic pains",
    "marked chilliness and sensation of cold",
    "pain in bones with cold sensation",
    "symptoms worse at same hour each day",
    "great sensitivity to damp weather",
  ],

  "Argentum cyanidum": [
    "violent burning pains in throat",
    "great hoarseness with laryngeal irritation",
    "constriction of throat",
    "respiratory difficulty with nervous excitement",
    "symptoms aggravated by speaking",
  ],

  "Argentum metallicum": [
    "hoarseness from overuse of voice",
    "laryngeal irritation with loss of voice",
    "pain in joints with stiffness",
    "marked weakness with nervous exhaustion",
    "symptoms worse from speaking",
  ],

  "Argentum muriaticum": [
    "uterine complaints with marked weakness",
    "pelvic congestion with bearing-down sensation",
    "headaches with visual disturbances",
    "nervous exhaustion with weakness",
    "symptoms associated with chronic uterine disorders",
  ],
    "Argentum nitricum": [
    "anticipatory anxiety with marked nervousness",
    "impulsive behavior with fear of impending events",
    "craving for sweets with digestive disturbance",
    "profuse flatulence with abdominal distension",
    "symptoms worse from mental excitement",
  ],

  "Arnica montana": [
    "sensation as if beaten or bruised",
    "great soreness of muscles and body",
    "fear of being touched or approached",
    "complaints after injury or overexertion",
    "bed feels too hard",
  ],

  "Arsenicum hydrogenisatum": [
    "great weakness with prostration",
    "burning sensations with marked restlessness",
    "anxiety with exhaustion",
    "coldness with weakness",
    "rapid loss of strength during acute illness",
  ],

  "Arsenicum iodatum": [
    "burning pains with marked weakness",
    "restlessness with anxiety",
    "chronic catarrhal complaints",
    "profuse irritating nasal discharge",
    "symptoms worse from warmth",
  ],

  "Arsenicum metallicum": [
    "marked weakness with nervous exhaustion",
    "burning sensations",
    "great anxiety with restlessness",
    "chilly state with sensitivity to cold",
    "prostration disproportionate to the complaint",
  ],

  "Arsenicum nitricum": [
    "burning pains with marked anxiety",
    "great weakness and prostration",
    "irritability with nervous exhaustion",
    "digestive disturbance with burning",
    "symptoms worse at night",
  ],

  "Arsenicum sulphuratum flavum": [
    "chronic respiratory catarrh",
    "burning sensations with weakness",
    "thick yellow respiratory discharge",
    "restlessness with marked prostration",
    "symptoms worse from heat",
  ],

  "Arsenicum sulphuratum rubrum": [
    "chronic skin eruptions with burning",
    "itching with burning sensations",
    "restlessness with anxiety",
    "marked weakness with chronic disease",
    "symptoms worse from warmth",
  ],

  "Arsenicum album": [
    "fear of death",
    "marked restlessness with anxiety",
    "burning pains better from heat",
    "fastidiousness and desire for order",
    "thirst for small quantities frequently",
  ],

  "Artemisia vulgaris": [
    "epileptic attacks with sudden loss of consciousness",
    "convulsions associated with menstrual disturbances",
    "nervous excitement with twitching",
    "irregular or absent menstruation with nervous symptoms",
    "symptoms associated with epilepsy and hysterical states",
  ],

  "Arum dracontium": [
    "violent burning in throat",
    "hoarseness with laryngeal irritation",
    "constant desire to clear the throat",
    "burning and rawness of mouth and throat",
    "respiratory symptoms with laryngeal obstruction",
  ],

  "Arum italicum": [
    "burning and rawness of mouth and throat",
    "hoarseness with violent irritation of larynx",
    "swelling and burning of tongue",
    "constant desire to clear throat",
    "symptoms worse from speaking",
  ],

  "Arum maculatum": [
    "violent burning and rawness of mouth",
    "excoriating discharges from nose",
    "constant picking of nose until it bleeds",
    "hoarseness with laryngeal irritation",
    "sore and swollen tongue",
  ],

  "Arum triphyllum": [
    "intense irritation of mouth and throat",
    "constant picking of nose until it becomes raw",
    "acrid excoriating nasal discharge",
    "hoarseness with violent laryngeal irritation",
    "restlessness with destructive picking of lips or nose",
  ],

  "Arundo donax": [
    "intense itching of nose",
    "itching of palate with sneezing",
    "watery nasal discharge with hay fever",
    "itching and irritation of eyes",
    "respiratory allergy with marked nasal symptoms",
  ],

  "Arundo mauritanica": [
    "intense itching inside the nose",
    "violent sneezing with nasal irritation",
    "itching of palate and throat",
    "watery coryza with burning",
    "hay-fever symptoms with respiratory irritation",
  ],

  "Asa foetida": [
    "marked hysterical symptoms with nervous excitement",
    "sensation of a ball rising from stomach to throat",
    "violent flatulence with upward pressure",
    "extreme sensitivity to touch",
    "symptoms worse from suppressed discharges",
  ],
    "Asarum europaeum": [
    "extreme nervous sensitivity",
    "aversion to tobacco smoke and tobacco smell",
    "sensation of coldness with nervous excitation",
    "headache with marked sensitivity to external impressions",
    "symptoms aggravated by mental excitement",
  ],

  "Asclepias cornuti": [
    "violent neuralgic pains",
    "painful cramps in muscles",
    "profuse perspiration with rheumatic complaints",
    "wandering pains in the limbs",
    "symptoms aggravated by motion",
  ],

  "Asclepias tuberosa": [
    "sharp stitching pains in chest",
    "pleuritic pains aggravated by breathing",
    "dry painful cough with chest soreness",
    "pain in chest extending to shoulder",
    "respiratory complaints with marked chest pain",
  ],

  "Asimina triloba": [
    "marked digestive disturbance",
    "nausea with vomiting",
    "headache with gastric symptoms",
    "great weakness with digestive complaints",
    "abdominal discomfort with loss of appetite",
  ],

  "Asparagus officinalis": [
    "marked urinary irritation",
    "burning sensation during urination",
    "frequent desire to urinate",
    "sharp pains in urinary tract",
    "urinary complaints with nervous restlessness",
  ],

  "Astacus fluviatilis": [
    "violent itching of skin",
    "urticarial eruptions with intense itching",
    "redness and burning of skin",
    "skin symptoms associated with hepatic disturbance",
    "symptoms aggravated by warmth",
  ],

  "Asterias rubens": [
    "marked left-sided complaints",
    "breast complaints with pain and tenderness",
    "burning or shooting pains in breast",
    "nervous excitement with irritability",
    "symptoms associated with menstrual disturbance",
  ],

  "Atropia sulphurica": [
    "violent nervous excitement",
    "marked dryness of mucous membranes",
    "dilated pupils with visual disturbance",
    "rapid pulse with heat and flushing",
    "delirium with great restlessness",
  ],

  Atropinium: [
    "sudden flushing with heat",
    "marked dryness of mouth and mucous membranes",
    "dilated pupils",
    "violent nervous excitement",
    "delirium with restlessness",
  ],

  "Aurum arsenicum": [
    "marked depression with anxiety",
    "burning pains with great weakness",
    "cardiac symptoms with oppression",
    "restlessness with profound prostration",
    "symptoms worse at night",
  ],

  "Aurum iodatum": [
    "marked glandular enlargement",
    "destructive inflammatory processes",
    "great weakness with nervous depression",
    "cardiac oppression with anxiety",
    "symptoms associated with chronic glandular disease",
  ],

  "Aurum muriaticum natronatum": [
    "marked uterine induration",
    "chronic uterine and ovarian complaints",
    "deep depression with suicidal thoughts",
    "cardiac symptoms with anxiety",
    "great weakness with chronic disease",
  ],

  "Aurum muriaticum": [
    "marked depression with suicidal thoughts",
    "cardiac oppression with anxiety",
    "glandular induration",
    "destructive inflammatory processes",
    "great weakness with profound mental exhaustion",
  ],

  "Aurum sulphuratum": [
    "marked nervous depression",
    "cardiac oppression with palpitations",
    "glandular swelling and induration",
    "burning pains with weakness",
    "restlessness with anxiety",
  ],

  "Aurum metallicum": [
    "deep depression with strong sense of guilt",
    "suicidal thoughts with despair",
    "marked cardiac oppression",
    "bone pains with destructive tendencies",
    "great weakness with anxiety and restlessness",
  ],
    Badiaga: [
    "marked muscular soreness and bruised feeling",
    "rheumatic pains with great tenderness",
    "pain aggravated by slightest motion",
    "sensation of soreness throughout the body",
    "symptoms worse from touch",
  ],

  "Balsamum peruvianum": [
    "chronic bronchial catarrh",
    "persistent cough with thick expectoration",
    "burning sensation in chest",
    "offensive respiratory secretions",
    "respiratory complaints with marked weakness",
  ],

  // Baptisia tinctoria — EXISTING PROFILE: do not duplicate

  "Baryta acetica": [
    "marked glandular enlargement",
    "great mental and physical sluggishness",
    "weakness with delayed development",
    "sore throat with swollen glands",
    "sensitivity to cold",
  ],

  "Baryta carbonica": [
    "marked shyness and lack of confidence",
    "delayed mental and physical development",
    "enlarged tonsils and cervical glands",
    "sore throat with glandular enlargement",
    "sensitivity to cold",
  ],

  "Baryta iodata": [
    "marked enlargement of glands",
    "hard swollen cervical glands",
    "tonsillar enlargement",
    "chronic glandular inflammation",
    "weakness with sluggish development",
  ],

  "Baryta muriatica": [
    "marked arterial and vascular complaints",
    "hard glandular enlargement",
    "hypertension with vascular tension",
    "vertigo with weakness",
    "chronic tonsillar and cervical gland enlargement",
  ],

  "Bartfelder": [
    "chronic rheumatic complaints",
    "stiffness and aching of joints",
    "digestive disturbance with abdominal discomfort",
    "skin complaints with itching",
    "symptoms associated with mineral spring exposure",
  ],

  "Bellis perennis": [
    "deep bruised soreness after injury",
    "trauma to soft tissues with marked soreness",
    "pelvic complaints after injury or overexertion",
    "soreness worse from touch",
    "muscular pains after physical exertion",
  ],

  // Belladonna — EXISTING PROFILE: do not duplicate

  "Benzoic acid": [
    "strong-smelling urine",
    "urinary complaints with highly offensive odor",
    "gouty pains with urinary disturbance",
    "rheumatic pains shifting from one joint to another",
    "symptoms associated with uric-acid diathesis",
  ],

  "Benzinum nitricum": [
    "marked nervous excitement",
    "headache with dizziness",
    "respiratory irritation with burning",
    "great weakness with trembling",
    "symptoms worse from inhalation of irritating fumes",
  ],

  Benzinum: [
    "marked nervous weakness",
    "dizziness with headache",
    "trembling with prostration",
    "respiratory irritation",
    "gastrointestinal disturbance with weakness",
  ],

  "Berberis vulgaris": [
    "sharp stitching pains radiating from kidneys",
    "renal colic with pain extending to bladder or thighs",
    "burning or cutting pains in urinary tract",
    "marked urinary sediment",
    "pain aggravated by movement",
  ],

  "Bismuthum oxidum": [
    "severe gastric pain",
    "vomiting with intense gastric irritation",
    "burning sensation in stomach",
    "gastric complaints with great anxiety",
    "marked weakness after vomiting",
  ],

  "Blatta americana": [
    "asthmatic attacks with marked respiratory oppression",
    "dyspnoea associated with damp weather",
    "thick bronchial mucus",
    "wheezing with difficulty breathing",
    "respiratory complaints worse at night",
  ],

  "Blatta orientalis": [
    "severe asthma with great dyspnoea",
    "wheezing with thick bronchial mucus",
    "asthma worse in damp weather",
    "marked chest oppression",
    "respiratory attacks worse at night",
  ],

  "Boletus laricis": [
    "periodic headaches with marked pain",
    "digestive disturbance with nausea",
    "burning sensations in stomach",
    "intermittent feverish complaints",
    "great weakness after acute attacks",
  ],

  "Boracicum acidum": [
    "aphthous ulcers in mouth",
    "burning and painful mucous membranes",
    "oral ulcers with marked soreness",
    "urinary burning and irritation",
    "skin and mucous membrane irritation",
  ],
    Borax: [
    "great fear of downward motion",
    "marked sensitivity to sudden noises",
    "aphthous ulcers in mouth",
    "burning and painful mouth ulcers",
    "anxiety with nervous sensitivity",
  ],

  "Bothrops lanceolatus": [
    "marked bleeding tendency",
    "dark or persistent haemorrhage",
    "swelling with bluish discoloration",
    "violent throbbing pains",
    "symptoms associated with vascular congestion",
  ],

  Bovista: [
    "marked flatulence and abdominal distension",
    "diarrhoea before important events",
    "clumsiness with tendency to drop things",
    "symptoms worse before menstruation",
    "sensation of swelling or enlargement of the body",
  ],

  "Brachyglottis repens": [
    "marked liver congestion",
    "digestive disturbance with hepatic symptoms",
    "jaundiced appearance",
    "abdominal discomfort with weakness",
    "biliary complaints with sluggish digestion",
  ],

  Bromium: [
    "laryngeal irritation with hoarseness",
    "dry spasmodic cough",
    "difficulty breathing with constriction of chest",
    "glandular enlargement",
    "symptoms worse in warm rooms and better at sea",
  ],

  "Brucea antidysenterica": [
    "violent diarrhoea with abdominal cramps",
    "dysenteric stools with great weakness",
    "burning abdominal pains",
    "marked prostration after diarrhoea",
    "digestive complaints with nausea",
  ],

  "Bryonia alba": [
    "dryness of mucous membranes",
    "pain aggravated by slightest motion",
    "desire to remain perfectly still",
    "great thirst for large quantities at long intervals",
    "irritability with headache and constipation",
  ],

  "Bufo sahytiensis": [
    "marked nervous excitability",
    "epileptic or convulsive tendencies",
    "sexual excitement with nervous symptoms",
    "great sensitivity to stimulation",
    "symptoms associated with glandular and genital complaints",
  ],

  "Bufo rana": [
    "marked sexual excitement",
    "epileptic attacks associated with sexual symptoms",
    "desire for solitude",
    "mental confusion with nervous excitement",
    "convulsions with marked prostration",
  ],

  "Cactus grandiflorus": [
    "sensation of constriction around heart",
    "violent palpitation with anxiety",
    "oppressive chest pain",
    "sensation as if heart were grasped by an iron hand",
    "symptoms worse from lying on left side",
  ],

  "Cadmium sulphuratum": [
    "violent vomiting with great prostration",
    "burning pains in stomach",
    "persistent nausea with weakness",
    "marked collapse after vomiting",
    "extreme exhaustion with gastric symptoms",
  ],

  Cahinca: [
    "marked urinary irritation",
    "burning during urination",
    "pain in bladder and urinary passages",
    "rheumatic complaints with urinary symptoms",
    "great weakness with urinary disturbance",
  ],

  Cainca: [
    "marked urinary irritation",
    "burning and frequent urination",
    "pain in kidneys or bladder",
    "dropsical tendency with urinary disturbance",
    "rheumatic pains associated with urinary symptoms",
  ],

  Cajuputum: [
    "spasmodic abdominal pains",
    "violent flatulence with distension",
    "nausea with digestive disturbance",
    "rheumatic pains with nervous symptoms",
    "marked sensitivity to cold air",
  ],

  "Caladium seguinum": [
    "marked sexual weakness",
    "sexual desire with inability to perform",
    "asthmatic symptoms with sexual debility",
    "great nervous exhaustion",
    "symptoms worse from tobacco",
  ],

  "Calcarea acetica": [
    "marked weakness with glandular complaints",
    "bone and joint pains with weakness",
    "digestive disturbance with acidity",
    "profuse perspiration with debility",
    "cold sensitivity with general weakness",
  ],
    "Calcarea arsenica": [
    "marked anxiety with great weakness",
    "burning sensations with prostration",
    "cardiac oppression with nervous symptoms",
    "restlessness with exhaustion",
    "symptoms worse at night",
  ],

  "Calcarea caustica": [
    "marked weakness with stiffness",
    "rheumatic pains with muscular contraction",
    "burning sensations with nervous exhaustion",
    "chronic joint complaints",
    "symptoms worse from cold",
  ],

  "Calcarea fluorata": [
    "hard glandular swellings",
    "indurated and nodular tissues",
    "varicose veins with hard nodules",
    "bone and connective-tissue complaints",
    "symptoms associated with chronic induration",
  ],

  "Calcarea iodata": [
    "enlarged tonsils and glands",
    "hard cervical glandular swellings",
    "chronic glandular inflammation",
    "rapidly developing glandular enlargement",
    "weakness with chronic glandular complaints",
  ],

  "Calcarea phosphorica": [
    "growing pains in children",
    "weakness during periods of rapid growth",
    "craving for smoked or salty foods",
    "bone pains with delayed development",
    "complaints after loss of fluids",
  ],

  "Calcarea sulphurica": [
    "suppuration with slow healing",
    "yellow pus from abscesses",
    "wounds that heal slowly",
    "skin eruptions with suppuration",
    "complaints after incomplete discharge of pus",
  ],

  "Calcarea silicata": [
    "marked glandular enlargement",
    "hard indurations with chronic inflammation",
    "great sensitivity to cold",
    "slow healing of wounds",
    "weakness with chronic suppurative complaints",
  ],

  // Calcarea carbonica — EXISTING PROFILE: do not duplicate

  "Calendula officinalis": [
    "traumatic wounds with marked soreness",
    "promotes healthy healing of wounds",
    "lacerated wounds with burning pain",
    "suppuration tendency after injury",
    "painful wounds sensitive to touch",
  ],

  "Calliandra houstoni": [
    "marked anaemia with weakness",
    "profuse bleeding with exhaustion",
    "palpitations associated with anaemia",
    "shortness of breath with weakness",
    "great prostration after blood loss",
  ],

  "Calotropis gigantea": [
    "marked muscular weakness",
    "rheumatic pains with stiffness",
    "painful swelling of joints",
    "digestive disturbance with weakness",
    "symptoms worse from exertion",
  ],

  "Caltha palustris": [
    "marked skin irritation with itching",
    "burning eruptions on skin",
    "watery eyes with nasal irritation",
    "respiratory allergy with itching",
    "symptoms aggravated by damp weather",
  ],

  "Camphora officinarum": [
    "sudden collapse with extreme coldness",
    "cold skin with great prostration",
    "violent spasmodic pains",
    "restlessness with anxiety",
    "symptoms associated with shock or sudden suppression",
  ],

  Canchalagua: [
    "intermittent fever with marked chilliness",
    "periodic fever with profuse perspiration",
    "great weakness during fever",
    "headache accompanying fever",
    "symptoms with marked periodicity",
  ],

  "Cannabis indica": [
    "marked mental excitement with rapid thoughts",
    "altered perception of time and space",
    "excessive loquacity",
    "delusions with unusual sensory experiences",
    "great nervous excitement",
  ],

  "Cannabis sativa": [
    "burning pain in urethra",
    "marked urinary irritation",
    "difficulty and pain during urination",
    "gonorrhoeal-type urethral discharge",
    "stitching pains along urethra",
  ],

  Cantharis: [
    "intense burning in urinary tract",
    "violent urging to urinate with scanty urine",
    "burning before, during and after urination",
    "great restlessness with urinary pain",
    "marked inflammation of mucous membranes",
  ],

  Capsicum: [
    "burning pains with chilliness",
    "homesickness with irritability",
    "marked sluggishness and aversion to exertion",
    "burning in stomach with thirst",
    "symptoms worse from drafts and cold air",
  ],
    "Carbolic acid": [
    "marked prostration with offensive discharges",
    "burning pains with great weakness",
    "offensive ulcers and putrid secretions",
    "nausea with gastric irritation",
    "symptoms associated with toxic or septic states",
  ],

  "Carbo animalis": [
    "marked glandular induration",
    "hard swollen glands",
    "great weakness with sluggish circulation",
    "burning pains with coldness",
    "chronic complaints with offensive discharges",
  ],

  "Carboneum hydrogenisatum": [
    "great prostration with nervous weakness",
    "burning sensations with exhaustion",
    "respiratory difficulty with weakness",
    "marked chilliness",
    "symptoms worse from exertion",
  ],

  "Carboneum oxygenisatum": [
    "marked respiratory oppression",
    "great weakness with suffocation",
    "cyanotic or congestive appearance",
    "burning sensations with prostration",
    "symptoms associated with impaired respiration",
  ],

  "Carboneum sulphuratum": [
    "marked nervous excitement with exhaustion",
    "burning sensations",
    "trembling with weakness",
    "respiratory irritation",
    "symptoms aggravated by mental or physical exertion",
  ],

  "Carbo vegetabilis": [
    "great collapse with coldness",
    "cold sweat with marked prostration",
    "air hunger with desire to be fanned",
    "flatulence with abdominal distension",
    "slow recovery after illness",
  ],

  "Carduus benedictus": [
    "marked gastric disturbance with nausea",
    "headache associated with digestive complaints",
    "bitter taste with digestive weakness",
    "liver complaints with nausea",
    "great weakness after gastric symptoms",
  ],

  "Carduus marianus": [
    "marked liver congestion",
    "pain in liver region",
    "biliary complaints with nausea",
    "jaundiced tendency with digestive disturbance",
    "constipation associated with liver dysfunction",
  ],

  Carlsbad: [
    "digestive complaints with sluggish liver",
    "constipation with abdominal fullness",
    "biliary disturbance",
    "flatulence with digestive weakness",
    "symptoms associated with chronic digestive dysfunction",
  ],

  Cascarilla: [
    "marked digestive weakness",
    "dyspepsia with nausea",
    "constipation with abdominal discomfort",
    "weakness after eating",
    "gastric complaints with nervous irritability",
  ],

  "Castor equi": [
    "painful cracks and fissures of nipples",
    "marked soreness of nipples",
    "breast complaints associated with lactation",
    "skin eruptions with intense itching",
    "pain aggravated by touch",
  ],

  "Castanea vesca": [
    "violent itching of skin",
    "urticarial or eruptive skin complaints",
    "burning and itching of skin",
    "digestive complaints associated with skin symptoms",
    "symptoms aggravated by warmth",
  ],

  Castoreum: [
    "marked nervous exhaustion",
    "spasmodic abdominal pains",
    "flatulence with colic",
    "hysterical or nervous symptoms",
    "weakness with tremulousness",
  ],

  "Caulophyllum thalictroides": [
    "spasmodic uterine pains",
    "irregular or painful menstruation",
    "weakness of uterine muscles",
    "rheumatic pains associated with menstrual complaints",
    "false or inefficient labor pains",
  ],

  // Causticum — EXISTING PROFILE if already present; add only if absent
  Causticum: [
    "paralytic weakness with stiffness",
    "contractures and weakness of muscles",
    "warts, especially hard or horny warts",
    "dry hacking cough with urinary weakness",
    "symptoms worse in cold dry weather",
  ],

  "Ceanothus americanus": [
    "marked splenic enlargement",
    "pain and heaviness in left hypochondrium",
    "anaemia with great weakness",
    "liver and spleen congestion",
    "periodic complaints with splenic tenderness",
  ],

  Cedron: [
    "periodic neuralgic pains occurring at exact times",
    "severe neuralgia around the eye",
    "periodic fever with marked regularity",
    "pain extending along nerves",
    "symptoms recurring at the same hour",
  ],

  "Cenchris contortrix": [
    "marked left-sided complaints",
    "constriction sensations",
    "dark bleeding with vascular symptoms",
    "great nervous excitement",
    "symptoms worse after sleep",
  ],

  "Centaurea tagana": [
    "marked urinary irritation",
    "burning during urination",
    "digestive complaints with abdominal discomfort",
    "rheumatic pains with urinary symptoms",
    "great weakness with urinary disturbance",
  ],

  "Cereus serpentaria": [
    "violent neuralgic pains",
    "burning and shooting pains",
    "marked nervous excitation",
    "cardiac oppression with anxiety",
    "symptoms aggravated by movement",
  ],

  "Cereus bonplandii": [
    "violent neuralgic pains",
    "marked cardiac oppression",
    "burning sensations in chest",
    "palpitation with nervous excitement",
    "great weakness with chest symptoms",
  ],
    "Cetraria islandica": [
    "dry irritating cough with weakness",
    "chronic bronchial irritation",
    "thick mucus with difficulty expectorating",
    "respiratory complaints with great exhaustion",
    "symptoms worse from cold air",
  ],

  // Chamomilla — EXISTING PROFILE: do not duplicate

  "Chelidonium majus": [
    "right-sided liver complaints",
    "pain under right shoulder blade with liver symptoms",
    "marked bilious disturbance",
    "yellow discoloration with sluggish liver",
    "symptoms associated with gallbladder and liver congestion",
  ],

  "Chenopodium anthelminticum": [
    "marked intestinal irritation",
    "abdominal cramps with digestive disturbance",
    "nausea with gastrointestinal symptoms",
    "worm-related digestive complaints",
    "weakness associated with intestinal disturbance",
  ],

  "Chenopodium vulvaria": [
    "very offensive body odor",
    "offensive perspiration",
    "offensive breath with digestive disturbance",
    "flatulence with foul odor",
    "marked digestive weakness",
  ],

  "Chenopodium glauci aphis": [
    "marked skin irritation with itching",
    "burning and stinging skin sensations",
    "digestive disturbance with abdominal discomfort",
    "nervous restlessness with skin symptoms",
    "symptoms aggravated by touch",
  ],

  "Chimaphila maculata": [
    "burning pain in urinary tract",
    "difficulty passing urine",
    "urinary complaints with marked irritation",
    "pain extending from kidneys toward bladder",
    "symptoms associated with urinary obstruction",
  ],

  "Chimaphila umbellata": [
    "urinary difficulty with constant desire to urinate",
    "burning during urination",
    "urine passes only after straining",
    "prostatic or bladder complaints",
    "urinary symptoms better from standing and leaning forward",
  ],

  "Chininum arsenicosum": [
    "marked periodic weakness",
    "neuralgic pains with burning character",
    "intermittent feverish complaints",
    "great prostration with nervous exhaustion",
    "symptoms occurring periodically",
  ],

  "Chininum bromatum": [
    "marked nervous excitement",
    "headache with vertigo",
    "periodic complaints with weakness",
    "trembling with nervous exhaustion",
    "symptoms worse at night",
  ],

  "Chininum sulphuricum": [
    "periodic neuralgic headaches",
    "intermittent fever with marked periodicity",
    "great weakness after fever",
    "ringing in ears with headache",
    "symptoms recurring at regular intervals",
  ],

  "China officinalis": [
    "great weakness after loss of fluids",
    "marked periodic fever",
    "flatulence with abdominal distension",
    "sensitivity to touch despite deep weakness",
    "profuse perspiration with exhaustion",
  ],

  "Chionanthus virginica": [
    "marked headache associated with liver disturbance",
    "bilious headache with nausea",
    "jaundiced tendency",
    "digestive complaints with hepatic congestion",
    "headache associated with gallbladder disturbance",
  ],

  Chloroformium: [
    "marked nervous excitement followed by collapse",
    "sudden dizziness with weakness",
    "nausea with gastric disturbance",
    "respiratory depression with prostration",
    "symptoms associated with anaesthetic effects",
  ],

  Chloralum: [
    "marked insomnia with nervous excitement",
    "persistent sleeplessness with mental activity",
    "great nervous exhaustion",
    "restlessness with inability to sleep",
    "weakness following prolonged insomnia",
  ],

  Chlorum: [
    "marked respiratory irritation",
    "spasmodic cough with constriction",
    "burning irritation of mucous membranes",
    "difficulty breathing with chest oppression",
    "symptoms aggravated by inhalation",
  ],

  Cholesterinum: [
    "marked liver and biliary complaints",
    "gallstone tendency",
    "pain in liver region",
    "digestive disturbance with biliary symptoms",
    "jaundiced tendency with sluggish liver",
  ],

  "Chromicum acidum": [
    "marked ulceration of mucous membranes",
    "offensive discharges from ulcers",
    "burning and destructive ulcerative symptoms",
    "nasal and throat irritation with ulceration",
    "great weakness associated with chronic ulceration",
  ],

  "Chromicum oxydatum": [
    "marked digestive disturbance",
    "gastric irritation with nausea",
    "burning pains in stomach",
    "weakness with digestive complaints",
    "symptoms associated with chronic gastric irritation",
  ],

  "Cicuta virosa": [
    "violent spasmodic convulsions",
    "marked rigidity of muscles",
    "opisthotonus-like spasms",
    "convulsions triggered by slight external stimuli",
    "mental confusion with severe nervous excitation",
  ],
    "Cimicifuga racemosa": [
    "marked mental and emotional instability",
    "painful muscular and rheumatic complaints",
    "headache associated with menstrual disturbance",
    "shooting pains with nervous hypersensitivity",
    "symptoms worse during menstruation",
  ],

  Cimex: [
    "marked restlessness with nervous excitement",
    "headache with pulsating pains",
    "muscular and rheumatic pains",
    "symptoms aggravated by warmth",
    "disturbed sleep with nervous irritability",
  ],

  Cina: [
    "extreme irritability in children",
    "grinding of teeth during sleep",
    "worm-related complaints",
    "constant hunger with abdominal symptoms",
    "aversion to being touched",
  ],

  "Cinchona boliviana": [
    "marked weakness after loss of fluids",
    "periodic neuralgic pains",
    "intermittent fever with chills",
    "great sensitivity to touch",
    "flatulence with abdominal distension",
  ],

  "Cinchonium sulphuricum": [
    "periodic neuralgic headaches",
    "intermittent fever with marked periodicity",
    "ringing in ears with headache",
    "great weakness after fever",
    "symptoms recurring at regular intervals",
  ],

  Cinnamomum: [
    "profuse haemorrhage with great weakness",
    "bleeding from slight causes",
    "violent headache with vascular excitement",
    "marked nervous excitement",
    "symptoms associated with excessive bleeding",
  ],

  Cinnabaris: [
    "marked frontal and orbital headache",
    "pain around eyes with pressure at root of nose",
    "genital complaints with burning",
    "alternating urinary and genital symptoms",
    "marked pelvic pressure",
  ],

  "Cistus canadensis": [
    "marked glandular swelling",
    "hard cervical glands",
    "sore throat with glandular enlargement",
    "extreme sensitivity to cold air",
    "chronic throat complaints with glandular involvement",
  ],

  "Citricum acidum": [
    "marked weakness with exhaustion",
    "sour or acidic digestive symptoms",
    "burning sensations with prostration",
    "headache associated with digestive disturbance",
    "great thirst with weakness",
  ],

  "Citrus limonum": [
    "headache with digestive disturbance",
    "nausea with gastric irritation",
    "acidic or sour digestive symptoms",
    "skin eruptions with itching",
    "weakness associated with digestive complaints",
  ],

  "Citrus vulgaris": [
    "marked nervous excitement",
    "headache with digestive disturbance",
    "palpitations with anxiety",
    "digestive complaints with nausea",
    "weakness following nervous excitement",
  ],

  "Clematis erecta": [
    "burning and itching of skin",
    "urinary difficulty with painful urination",
    "testicular swelling and pain",
    "symptoms worse from warmth",
    "urinary complaints with genital involvement",
  ],

  Cobaltum: [
    "marked sexual weakness",
    "backache associated with sexual exhaustion",
    "nervous exhaustion with weakness",
    "burning pains in spine or back",
    "symptoms aggravated by sexual excess",
  ],

  "Coccus cacti": [
    "spasmodic cough with thick stringy mucus",
    "violent coughing attacks with choking",
    "cough worse at night",
    "haemorrhagic tendency with respiratory complaints",
    "thick mucus difficult to expel",
  ],

  Coca: [
    "marked mental and physical exhaustion",
    "great nervous excitement",
    "shortness of breath at high altitude",
    "palpitations with anxiety",
    "insomnia with racing thoughts",
  ],

  "Cocainum muriaticum": [
    "marked nervous excitement",
    "insomnia with mental overactivity",
    "palpitations with anxiety",
    "great mental and physical exhaustion",
    "heightened sensory sensitivity",
  ],

  "Coccinella septempunctata": [
    "marked itching of skin",
    "burning and stinging eruptions",
    "neuralgic pains with skin irritation",
    "symptoms associated with menstrual disturbance",
    "great nervous sensitivity",
  ],

  "Cocculus indicus": [
    "marked weakness from loss of sleep",
    "motion sickness with nausea and vertigo",
    "great dizziness with nausea",
    "muscular weakness and trembling",
    "symptoms worse from prolonged mental or physical exertion",
  ],
    "Cochlearia armoracia": [
    "burning irritation of mucous membranes",
    "violent coryza with sneezing",
    "watery nasal discharge with burning",
    "digestive disturbance with flatulence",
    "symptoms aggravated by cold air",
  ],

  Codeinum: [
    "marked drowsiness with mental dullness",
    "dry irritating cough",
    "suppression of secretions",
    "constipation with sluggish bowel",
    "great weakness with sleepiness",
  ],

  "Coffea tosta": [
    "marked nervous excitement",
    "insomnia with racing thoughts",
    "oversensitivity to pain",
    "mental activity preventing sleep",
    "palpitations from emotional excitement",
  ],

  "Coffea cruda": [
    "extreme mental excitement",
    "insomnia from racing thoughts",
    "oversensitivity to noise and pain",
    "rapid flow of ideas",
    "symptoms worse from emotional excitement",
  ],

  "Colchicum autumnale": [
    "extreme sensitivity to the smell of food",
    "nausea and vomiting from sight or smell of food",
    "violent gouty pains",
    "marked abdominal bloating",
    "symptoms aggravated by slightest movement",
  ],

  "Collinsonia canadensis": [
    "marked hemorrhoidal tendency",
    "pelvic congestion with constipation",
    "sensation of fullness in rectum",
    "varicose veins with pelvic symptoms",
    "cardiac symptoms associated with hemorrhoids",
  ],

  Colocynthis: [
    "violent colicky abdominal pain",
    "pain better by bending double",
    "pain better from hard pressure",
    "sudden neuralgic pains",
    "symptoms aggravated by anger or indignation",
  ],

  Colostrum: [
    "marked digestive disturbance in infants",
    "diarrhoea with weakness",
    "abdominal colic with digestive irritation",
    "vomiting with prostration",
    "symptoms associated with feeding intolerance",
  ],

  "Comocladia dentata": [
    "marked burning and itching of skin",
    "swelling with painful skin eruptions",
    "right-sided complaints",
    "symptoms worse from touch",
    "burning pains with inflammatory swelling",
  ],

  // Conium maculatum — EXISTING PROFILE: do not duplicate

  Cundurango: [
    "painful cracks at corners of mouth",
    "fissures and ulceration of lips",
    "burning pain in oesophagus",
    "difficulty swallowing with oesophageal irritation",
    "marked gastric weakness",
  ],

  "Convolvulus duartinus": [
    "marked intestinal colic",
    "abdominal pain with constipation",
    "spasmodic pains in abdomen",
    "digestive disturbance with flatulence",
    "symptoms aggravated by movement",
  ],

  "Convallaria majalis": [
    "marked cardiac weakness",
    "palpitation with shortness of breath",
    "sensation of heart enlargement",
    "weak pulse with cardiac oppression",
    "dyspnoea associated with cardiac symptoms",
  ],

  "Copaiva officinalis": [
    "marked urinary irritation",
    "burning during urination",
    "profuse mucous urethral discharge",
    "cystitis with frequent urging",
    "respiratory catarrh with thick mucus",
  ],

  "Corallium rubrum": [
    "violent spasmodic cough",
    "cough in rapid successive attacks",
    "sensation of constriction in throat",
    "respiratory complaints aggravated by cold air",
    "marked sensitivity of respiratory passages",
  ],

  "Coriaria ruscifolia": [
    "marked nervous excitement",
    "convulsive or spasmodic symptoms",
    "vertigo with confusion",
    "digestive disturbance with weakness",
    "great nervous irritability",
  ],

  "Cornus florida": [
    "marked intermittent fever",
    "great weakness during fever",
    "digestive disturbance with bilious symptoms",
    "headache accompanying fever",
    "periodic complaints with chilliness",
  ],

  "Cornus sericea": [
    "marked weakness with digestive disturbance",
    "intermittent feverish symptoms",
    "bilious complaints with headache",
    "abdominal discomfort with prostration",
    "periodic symptoms with chilliness",
  ],

  "Cornus circinata": [
    "marked digestive disturbance",
    "bilious symptoms with headache",
    "periodic fever with weakness",
    "abdominal discomfort with nausea",
    "great prostration during acute complaints",
  ],

  "Cotyledon umbilicus": [
    "marked burning and itching of skin",
    "skin eruptions with painful irritation",
    "gastrointestinal disturbance with weakness",
    "nervous restlessness with skin symptoms",
    "symptoms aggravated by touch",
  ],

  "Crocus sativus": [
    "marked changeability of mental state",
    "involuntary laughter with emotional excitement",
    "dark stringy or clotted haemorrhage",
    "sensation of something alive moving in the abdomen",
    "symptoms associated with menstrual disturbance",
  ],
    "Crotalus cascavella": [
    "marked haemorrhagic tendency",
    "dark or decomposed blood",
    "great weakness with collapse",
    "swelling with bluish or dusky discoloration",
    "symptoms associated with septic or toxic states",
  ],

  "Crotalus horridus": [
    "dark fluid haemorrhages",
    "bleeding from multiple outlets",
    "marked prostration with collapse",
    "right-sided complaints",
    "symptoms worse after sleep",
  ],

  "Croton tiglium": [
    "violent diarrhoea immediately after eating or drinking",
    "burning and excoriating stools",
    "skin eruptions with intense itching",
    "vesicular eruptions with burning",
    "symptoms aggravated by slightest touch",
  ],

  "Cubeba officinalis": [
    "burning irritation of urinary passages",
    "frequent urging to urinate",
    "profuse urethral discharge",
    "burning and itching of mucous membranes",
    "respiratory catarrh with thick mucus",
  ],

  "Culex moscæ": [
    "marked nervous restlessness",
    "itching and stinging skin sensations",
    "headache with nervous irritation",
    "digestive disturbance with weakness",
    "symptoms aggravated by warmth",
  ],

  "Cuprum aceticum": [
    "violent muscular spasms",
    "convulsions with rigidity",
    "blue or cyanotic appearance during spasms",
    "sudden collapse with cramps",
    "spasms aggravated by touch",
  ],

  "Cuprum arsenicosum": [
    "violent muscular cramps",
    "convulsive attacks with great weakness",
    "burning sensations with nervous excitation",
    "cyanotic appearance during spasms",
    "marked prostration after convulsions",
  ],

  "Cuprum nitricum": [
    "violent cramps and spasms",
    "convulsions with muscular rigidity",
    "cyanosis during attacks",
    "great nervous excitement",
    "spasms associated with gastric disturbance",
  ],

  "Cuprum sulphuricum": [
    "violent muscular spasms",
    "convulsions with rigidity",
    "cramps with abdominal symptoms",
    "cyanotic discoloration during attacks",
    "great weakness after spasms",
  ],

  "Cuprum metallicum": [
    "violent muscular cramps",
    "sudden spasmodic attacks",
    "convulsions with cyanosis",
    "spasms relieved by drinking cold water",
    "great prostration after convulsions",
  ],

  Curare: [
    "marked muscular paralysis",
    "progressive weakness of voluntary muscles",
    "difficulty moving with preserved consciousness",
    "respiratory weakness with paralysis",
    "great prostration with muscular relaxation",
  ],

  "Cyclamen europaeum": [
    "menstrual complaints with headache",
    "visual disturbances associated with headache",
    "vertigo with nausea",
    "marked sadness and irritability",
    "symptoms worse from rich fatty food",
  ],

  "Cypripedium pubescens": [
    "marked nervous excitement",
    "insomnia with excessive mental activity",
    "restlessness with inability to remain still",
    "children become excited and wakeful at night",
    "oversensitivity to sensory impressions",
  ],

  "Daphne indica": [
    "severe neuralgic pains",
    "bone pains with marked sensitivity",
    "burning and itching skin eruptions",
    "pain aggravated by touch",
    "restlessness with nervous irritation",
  ],

  "Derris pinnata": [
    "marked digestive disturbance",
    "abdominal cramps with weakness",
    "nausea and vomiting",
    "diarrhoeal complaints with prostration",
    "burning sensations in stomach",
  ],

  "Digitalis purpurea": [
    "slow weak pulse",
    "marked cardiac weakness with faintness",
    "violent palpitation with anxiety",
    "great exhaustion from slight exertion",
    "sensation that the heart will stop if movement is made",
  ],

  "Dioscorea villosa": [
    "violent abdominal colic",
    "pain better from stretching or bending backward",
    "pain worse from bending forward",
    "flatulence with abdominal distension",
    "neuralgic pains radiating along nerves",
  ],

  "Dirca palustris": [
    "marked neuralgic pains",
    "burning and shooting sensations",
    "rheumatic pains with stiffness",
    "great weakness with nervous symptoms",
    "symptoms aggravated by movement",
  ],

  "Dolichos pruriens": [
    "intense itching without visible eruption",
    "itching worse at night",
    "pruritus associated with liver complaints",
    "constipation with abdominal discomfort",
    "itching aggravated by warmth of bed",
  ],

  Doryphora: [
    "marked nervous irritability",
    "burning and stinging skin sensations",
    "digestive disturbance with nausea",
    "headache with nervous excitement",
    "symptoms aggravated by touch",
  ],

  "Drosera rotundifolia": [
    "violent spasmodic cough",
    "dry barking cough worse at night",
    "cough aggravated by lying down",
    "cough with gagging or vomiting",
    "deep chest irritation with repeated coughing attacks",
  ],

  Duboisinum: [
    "marked nervous excitement",
    "dilated pupils with visual disturbance",
    "dryness of mouth and mucous membranes",
    "rapid pulse with restlessness",
    "delirium with great mental excitation",
  ],

  Dulcamara: [
    "complaints after getting wet while chilled",
    "symptoms from sudden change from warm to cold damp weather",
    "rheumatic pains after exposure to damp cold",
    "catarrhal complaints after becoming chilled",
    "symptoms aggravated by cold damp weather",
  ],
    "Echinacea angustifolia": [
    "marked septic or toxic states",
    "offensive discharges with tendency to tissue breakdown",
    "soreness and burning of mucous membranes",
    "swollen painful glands and lymphatic tissues",
    "great prostration with blood-poisoning type symptoms",
  ],

  "Elaps corallinus": [
    "marked haemorrhagic tendency",
    "dark or black blood",
    "left-sided complaints",
    "sensation of coldness with great weakness",
    "symptoms aggravated by eating or drinking",
  ],

  "Elaterium": [
    "profuse watery diarrhoea",
    "sudden explosive evacuation",
    "stools expelled with great force",
    "gastrointestinal complaints with nausea and vomiting",
    "marked weakness following diarrhoea",
  ],

  "Epigea repens": [
    "urinary irritation with burning",
    "frequent urging to urinate",
    "urine with offensive or irritating character",
    "renal or bladder discomfort",
    "urinary complaints with rheumatic pains",
  ],

  "Equisetum hyemale": [
    "marked bladder irritation",
    "constant desire to urinate",
    "frequent urination with scanty output",
    "bladder pain and burning",
    "pain at the end of urination",
  ],

  "Erechthites hieracifolia": [
    "profuse uterine haemorrhage",
    "bright red bleeding with weakness",
    "haemorrhagic conditions with great prostration",
    "bleeding associated with uterine complaints",
    "marked nervous exhaustion after blood loss",
  ],

  "Erigeron canadense": [
    "profuse bright red haemorrhage",
    "uterine bleeding with frequent urging to urinate",
    "haemorrhage aggravated by slightest movement",
    "bleeding with pelvic congestion",
    "great weakness from loss of blood",
  ],

  "Eryngium aquaticum": [
    "urinary irritation with burning",
    "frequent urging to urinate",
    "painful urination with bladder discomfort",
    "renal and urinary tract complaints",
    "digestive disturbance with abdominal discomfort",
  ],

  Ether: [
    "marked nervous excitement",
    "sudden faintness and collapse",
    "great sensitivity to external impressions",
    "trembling with weakness",
    "symptoms associated with profound nervous exhaustion",
  ],

  "Eucalyptus globulus": [
    "catarrhal complaints with thick mucus",
    "respiratory congestion with difficult breathing",
    "offensive bronchial secretions",
    "urinary irritation with increased urination",
    "symptoms associated with febrile septic states",
  ],

  "Eugenia jambos": [
    "marked throat inflammation",
    "swollen tonsils with difficulty swallowing",
    "burning and dryness of throat",
    "mouth and throat complaints with offensive secretions",
    "fever associated with inflammatory throat symptoms",
  ],

  "Euonymus europaeus": [
    "marked digestive disturbance with constipation",
    "liver complaints with abdominal discomfort",
    "bilious symptoms with headache",
    "weakness associated with hepatic disturbance",
    "urinary complaints with digestive symptoms",
  ],

  "Eupatorium perfoliatum": [
    "violent aching of bones and muscles",
    "influenza-like state with intense soreness",
    "severe thirst for large quantities of cold water",
    "bone pains with chill and fever",
    "headache with aching and soreness of the eyeballs",
  ],

  "Eupatorium purpureum": [
    "marked urinary irritation",
    "frequent urging to urinate",
    "burning with difficult urination",
    "kidney and bladder complaints",
    "urinary symptoms associated with back or pelvic pain",
  ],

  Euphorbium: [
    "violent burning pains",
    "burning vesicular skin eruptions",
    "severe irritation of mucous membranes",
    "painful ulcerative or destructive lesions",
    "symptoms aggravated by touch",
  ],

  "Euphrasia officinalis": [
    "profuse acrid lachrymation",
    "eye irritation with burning tears",
    "coryza with bland nasal discharge",
    "cough aggravated by exposure to light or wind",
    "marked eye symptoms with redness and photophobia",
  ],

  Eupion: [
    "marked nervous weakness",
    "profuse sweating with exhaustion",
    "uterine complaints with weakness",
    "menstrual disturbances with nervous symptoms",
    "symptoms associated with profound prostration",
  ],

  Fagopyrum: [
    "marked skin irritation and itching",
    "burning eruptions aggravated by warmth",
    "headache with vascular congestion",
    "restlessness with nervous excitation",
    "skin symptoms aggravated by sunlight or heat",
  ],

  "Ferrum aceticum": [
    "marked anaemic weakness",
    "pale face with easy flushing",
    "palpitations with weakness",
    "haemorrhagic tendency with exhaustion",
    "headache associated with anaemic states",
  ],
    "Ferrum arsenicosum": [
    "marked anaemic weakness with exhaustion",
    "pale face with easy flushing",
    "palpitations with weakness",
    "burning pains with nervous restlessness",
    "haemorrhagic tendency with prostration",
  ],

  "Ferrum iodatum": [
    "marked glandular enlargement",
    "anaemia with weakness and emaciation",
    "palpitations with easy fatigue",
    "inflammatory conditions with anaemic tendency",
    "symptoms associated with enlarged thyroid or lymphatic glands",
  ],

  "Ferrum muriaticum": [
    "marked anaemic weakness",
    "pale face with flushing",
    "uterine complaints with haemorrhagic tendency",
    "digestive weakness with abdominal discomfort",
    "palpitations with exhaustion",
  ],

  "Ferrum magneticum": [
    "marked neuralgic pains",
    "rheumatic pains with stiffness",
    "anaemic weakness with exhaustion",
    "sensitivity to touch over painful areas",
    "wandering pains with muscular weakness",
  ],

  "Ferrum phosphoricum": [
    "early inflammatory states with fever",
    "bright red congestion with heat",
    "easy haemorrhage with weakness",
    "anaemic tendency with flushed face",
    "acute complaints with comparatively mild constitutional symptoms",
  ],

  "Ferrum picricum": [
    "marked nervous exhaustion",
    "headache with pressure and heaviness",
    "neuralgic pains with weakness",
    "prostration after mental or physical exertion",
    "burning sensations with nervous irritation",
  ],

  "Ferrum sulphuricum": [
    "marked anaemic weakness",
    "pale face with flushing",
    "digestive disturbance with weakness",
    "palpitations with exhaustion",
    "haemorrhagic tendency with prostration",
  ],

  "Ferrum metallicum": [
    "anaemia with marked weakness",
    "pale face with easy flushing",
    "palpitations with exertion",
    "headache associated with anaemic states",
    "weakness despite relatively strong muscular appearance",
  ],

  "Filix mas": [
    "marked intestinal worm symptoms",
    "abdominal discomfort associated with intestinal parasites",
    "nausea with digestive disturbance",
    "weakness associated with parasitic irritation",
    "anal itching with suspected worm infestation",
  ],

  "Fluoricum acidum": [
    "destructive ulcerative processes",
    "bone and dental complaints with rapid tissue destruction",
    "hot flushes with marked restlessness",
    "varicose veins with burning sensations",
    "complaints aggravated by warmth and relieved by cold applications",
  ],

  "Formica rufa": [
    "marked rheumatic and arthritic pains",
    "stiffness with muscular soreness",
    "pain aggravated by movement",
    "burning and stinging sensations",
    "complaints aggravated by damp weather",
  ],

  "Fragaria vesca": [
    "marked urticarial skin eruptions",
    "itching and burning of skin",
    "swelling of lips or mucous membranes",
    "digestive complaints associated with strawberries or fruit",
    "skin symptoms with allergic tendency",
  ],

  "Gadus morrhua": [
    "marked weakness with anaemic tendency",
    "digestive disturbance with poor assimilation",
    "respiratory complaints with weakness",
    "emaciation with loss of strength",
    "symptoms associated with nutritional deficiency",
  ],

  "Gallicum acidum": [
    "marked haemorrhagic tendency",
    "profuse bleeding with weakness",
    "burning and ulcerative mucous membrane complaints",
    "dark or offensive discharges",
    "great prostration following blood loss",
  ],

  "Gambogia": [
    "sudden watery diarrhoea",
    "stool expelled suddenly and forcefully",
    "gastrointestinal irritation with abdominal cramps",
    "diarrhoea followed by marked weakness",
    "vomiting associated with violent digestive disturbance",
  ],

  "Gelsemium sempervirens": [
    "marked dullness and drowsiness",
    "heavy drooping eyelids",
    "trembling with muscular weakness",
    "vertigo with mental and physical sluggishness",
    "headache with occipital or band-like pressure",
  ],

  "Genista tinctoria": [
    "marked urinary disturbance",
    "frequent urging to urinate",
    "bladder irritation with burning",
    "respiratory complaints with oppression",
    "digestive disturbance with abdominal discomfort",
  ],

  "Gentiana cruciata": [
    "marked digestive weakness",
    "bitter taste with gastric disturbance",
    "loss of appetite with weakness",
    "abdominal discomfort after eating",
    "digestive complaints with nausea",
  ],

  "Gentiana lutea": [
    "marked gastric weakness",
    "bitter taste with increased appetite",
    "indigestion with abdominal distension",
    "nausea with digestive discomfort",
    "digestive complaints aggravated after eating",
  ],
    "Geranium maculatum": [
    "marked haemorrhagic tendency",
    "profuse uterine bleeding with weakness",
    "bleeding from mucous membranes",
    "astringent effect on relaxed tissues",
    "great prostration following blood loss",
  ],

  "Gettisburg water": [
    "marked digestive disturbance",
    "abdominal discomfort with bloating",
    "urinary irritation",
    "general weakness with functional complaints",
    "symptoms associated with impaired elimination",
  ],

  Ginseng: [
    "marked nervous exhaustion",
    "mental and physical fatigue",
    "muscular weakness with aching",
    "headache associated with nervous exhaustion",
    "symptoms aggravated by exertion",
  ],

  Glanderine: [
    "marked glandular enlargement",
    "painful swollen glands",
    "inflammatory glandular complaints",
    "tenderness of affected glands",
    "weakness associated with glandular disturbance",
  ],

  Glonoin: [
    "violent throbbing headache",
    "marked vascular congestion with flushing",
    "headache worse from heat and sun",
    "sensation of pressure or expansion in the head",
    "complaints aggravated by sudden motion",
  ],

  Gnaphalium: [
    "sciatic pain with numbness",
    "neuralgic pain alternating with numbness",
    "pain relieved by sitting or flexing the affected limb",
    "rheumatic pains with stiffness",
    "pain associated with digestive or urinary complaints",
  ],

  "Gossypium herbaceum": [
    "uterine complaints with delayed or irregular menstruation",
    "menstrual pain with nausea",
    "uterine congestion with pelvic discomfort",
    "morning sickness with menstrual disturbance",
    "uterine symptoms associated with weakness",
  ],

  "Granatum punica": [
    "marked intestinal worm symptoms",
    "itching and crawling sensations around the anus",
    "digestive disturbance with nausea",
    "abdominal cramps associated with parasites",
    "weakness associated with intestinal irritation",
  ],

  Graphites: [
    "thick sticky honey-like discharges",
    "cracks and fissures of skin, especially folds",
    "eczema with oozing and crust formation",
    "constipation with large hard stools",
    "marked tendency to obesity and sluggishness",
  ],

  "Gratiola officinalis": [
    "violent digestive disturbance",
    "watery diarrhoea with abdominal cramps",
    "great thirst with gastrointestinal irritation",
    "headache associated with digestive upset",
    "symptoms aggravated after eating or drinking",
  ],

  "Grindelia robusta": [
    "difficult breathing with oppression of chest",
    "respiratory complaints with thick mucus",
    "asthmatic symptoms worse when lying down",
    "must sit up to breathe comfortably",
    "cough with difficult expectoration",
  ],

  Guaco: [
    "marked muscular and rheumatic pains",
    "stiffness with painful movement",
    "neuralgic pains with weakness",
    "respiratory complaints with chest oppression",
    "symptoms associated with muscular soreness",
  ],

  Guaiacum: [
    "marked rheumatic pains with stiffness",
    "painful contracted muscles and joints",
    "great intolerance of heat",
    "joint pains with swelling and inflammation",
    "pain aggravated by movement",
  ],

  "Guano australis": [
    "marked respiratory catarrh",
    "difficult breathing with chest oppression",
    "thick bronchial mucus",
    "asthmatic complaints with weakness",
    "cough with difficult expectoration",
  ],

  Guarana: [
    "violent headache with nervous excitement",
    "headache associated with digestive disturbance",
    "migraine with nausea",
    "mental fatigue with nervous exhaustion",
    "headache aggravated by mental exertion",
  ],

  Guarea: [
    "marked headache with gastric disturbance",
    "bilious complaints with nausea",
    "abdominal discomfort with weakness",
    "rheumatic or muscular pains",
    "digestive symptoms associated with headache",
  ],

  Gymnocladus: [
    "marked throat and tonsillar inflammation",
    "swollen glands with throat discomfort",
    "difficulty swallowing",
    "headache associated with throat inflammation",
    "fever with glandular enlargement",
  ],

  "Hæmatoxylon": [
    "marked neuralgic pains",
    "severe abdominal colic",
    "painful muscular spasms",
    "burning sensations with abdominal discomfort",
    "rheumatic pains with stiffness",
  ],
    "Hamamelis virginica": [
    "marked venous congestion with haemorrhagic tendency",
    "dark venous bleeding with soreness",
    "varicose veins with bruised aching sensation",
    "haemorrhoids with bleeding and soreness",
    "painful congested veins with weakness",
  ],

  "Hecla lava": [
    "marked bony enlargement or exostosis",
    "painful swelling of bones",
    "jaw and dental complaints with bony involvement",
    "neuralgic pain associated with bone disease",
    "bone pains aggravated by touch or pressure",
  ],

  "Hedeoma pulegioides": [
    "marked uterine and menstrual disturbance",
    "pelvic pains with menstrual irregularity",
    "urinary irritation with frequent urging",
    "headache associated with digestive disturbance",
    "nervous restlessness with abdominal discomfort",
  ],

  "Helleborus niger": [
    "marked mental dullness with sluggish responses",
    "stuporous state with slow comprehension",
    "automatic movements with diminished consciousness",
    "headache with heavy congestive sensation",
    "symptoms associated with serous effusions",
  ],

  Heloderma: [
    "marked coldness with profound weakness",
    "violent neuralgic pains",
    "numbness and tingling with weakness",
    "cardiac or circulatory symptoms with cold extremities",
    "symptoms aggravated by cold",
  ],

  "Helonias dioica": [
    "marked uterine weakness and prolapse",
    "bearing-down sensation in pelvis",
    "uterine complaints with extreme fatigue",
    "backache associated with uterine weakness",
    "mental depression with awareness of pelvic disorder",
  ],

  "Hepar sulphuris calcareum": [
    "extreme sensitivity to cold air and slightest draft",
    "suppurative tendency with painful inflammation",
    "splinter-like pains",
    "marked sensitivity to touch",
    "foul-smelling discharges with tendency to abscess formation",
  ],

  Hippomanes: [
    "marked nervous excitement",
    "spasmodic and convulsive symptoms",
    "digestive disturbance with abdominal discomfort",
    "weakness with trembling",
    "symptoms associated with sexual or genital irritation",
  ],

  "Hippozænium": [
    "marked catarrhal mucous membrane complaints",
    "offensive nasal discharge",
    "respiratory irritation with thick mucus",
    "digestive disturbance with nausea",
    "general weakness with chronic mucous discharge",
  ],

  Homarus: [
    "marked digestive disturbance",
    "nausea with abdominal discomfort",
    "skin irritation with itching",
    "rheumatic pains with stiffness",
    "weakness associated with digestive complaints",
  ],

  "Hura braziliensis": [
    "marked vesicular skin eruptions",
    "intense itching with burning skin",
    "skin complaints aggravated by scratching",
    "respiratory irritation with spasmodic cough",
    "nervous restlessness with skin hypersensitivity",
  ],

  "Hydrocyanicum acidum": [
    "sudden collapse with profound weakness",
    "violent spasmodic or convulsive attacks",
    "cyanotic discoloration with respiratory distress",
    "marked cardiac oppression and faintness",
    "rapidly developing symptoms with great prostration",
  ],

  "Hydrastis canadensis": [
    "thick ropy tenacious mucous discharges",
    "catarrhal complaints with yellow or offensive mucus",
    "marked gastric weakness and indigestion",
    "constipation with sluggish bowel action",
    "chronic mucous membrane inflammation with exhaustion",
  ],

  "Hydrangea arborescens": [
    "marked urinary irritation",
    "frequent urging to urinate",
    "renal pain with urinary difficulty",
    "gravel or calculus tendency",
    "urinary complaints with pain in kidney region",
  ],

  "Hydrocotyle asiatica": [
    "marked thickening and induration of skin",
    "scaly or hyperkeratotic skin eruptions",
    "intense itching with skin irritation",
    "chronic skin complaints with tissue infiltration",
    "skin symptoms aggravated by scratching",
  ],

  "Hyoscyamus niger": [
    "marked jealousy and suspiciousness",
    "involuntary laughter or inappropriate behaviour",
    "talkativeness with sexual excitement",
    "delirious states with agitation",
    "muscular twitching and spasmodic movements",
  ],

  "Hypericum perforatum": [
    "marked nerve injury with severe pain",
    "shooting neuralgic pains along nerves",
    "pain after injuries to nerve-rich areas",
    "numbness and tingling following trauma",
    "extreme sensitivity of injured parts to touch",
  ],
    "Iberis amara": [
    "marked cardiac palpitation with anxiety",
    "sensation of constriction around the heart",
    "pain extending to left arm or shoulder",
    "cardiac symptoms aggravated by slight exertion",
    "digestive disturbance associated with heart complaints",
  ],

  "Ictodes foetida": [
    "marked digestive disturbance with offensive symptoms",
    "abdominal distension with flatulence",
    "nausea with gastric irritation",
    "offensive discharges from mucous membranes",
    "weakness associated with digestive disturbance",
  ],

  "Ignatia amara": [
    "marked emotional sensitivity with changeable symptoms",
    "grief or emotional shock followed by physical complaints",
    "spasmodic symptoms with contradictory manifestations",
    "sensation of a lump in the throat",
    "symptoms aggravated by emotional excitement",
  ],

  "Illicium anisatum": [
    "marked nervous excitement",
    "headache with dizziness",
    "digestive disturbance with nausea",
    "spasmodic abdominal complaints",
    "weakness with nervous irritability",
  ],

  "Indium metallicum": [
    "marked mental and physical exhaustion",
    "headache with pressure or heaviness",
    "sexual weakness with nervous exhaustion",
    "depression associated with weakness",
    "symptoms aggravated by mental exertion",
  ],

  Indigo: [
    "marked neuralgic pains",
    "severe headache with nervous irritation",
    "deep-seated abdominal pain",
    "spasmodic muscular symptoms",
    "mental depression with nervous exhaustion",
  ],

  Ingluvin: [
    "marked gastric weakness",
    "indigestion with heaviness after eating",
    "nausea with abdominal distension",
    "gastric complaints with poor digestion",
    "symptoms aggravated after rich or heavy food",
  ],

  "Inula helenium": [
    "marked respiratory catarrh",
    "cough with thick bronchial mucus",
    "chest oppression with difficult breathing",
    "urinary irritation with frequent urging",
    "digestive disturbance with abdominal discomfort",
  ],

  Iodium: [
    "marked restlessness with increased activity",
    "rapid emaciation despite good appetite",
    "glandular enlargement with wasting",
    "great intolerance of heat",
    "symptoms aggravated by rest and relieved by continued motion",
  ],

  Iodoformum: [
    "marked wasting and emaciation",
    "offensive mucous discharges",
    "ulcerative and destructive processes",
    "great nervous restlessness",
    "symptoms associated with chronic septic states",
  ],

  Ipecacuanha: [
    "persistent nausea out of proportion to vomiting",
    "clean tongue despite severe nausea",
    "spasmodic cough with nausea or vomiting",
    "bronchial complaints with wheezing",
    "symptoms aggravated by warm humid conditions",
  ],

  "Ipomoea purpurea": [
    "marked digestive disturbance",
    "nausea with abdominal cramps",
    "watery diarrhoea with weakness",
    "headache associated with gastric complaints",
    "symptoms aggravated after eating",
  ],

  "Iris florentina": [
    "marked headache with gastric disturbance",
    "nausea associated with digestive complaints",
    "burning sensations in stomach",
    "bitter taste with digestive upset",
    "neuralgic pains with gastrointestinal symptoms",
  ],

  "Iris foetidissima": [
    "marked digestive disturbance",
    "nausea with abdominal discomfort",
    "offensive discharges",
    "headache associated with gastric irritation",
    "weakness with digestive complaints",
  ],

  "Iris germanica": [
    "marked burning pains in digestive tract",
    "nausea with gastric irritation",
    "headache associated with digestive disturbance",
    "profuse salivation with gastric symptoms",
    "neuralgic pains with burning sensations",
  ],

  Iridium: [
    "marked nervous exhaustion",
    "severe neuralgic pains",
    "headache with mental fatigue",
    "weakness following prolonged exertion",
    "depressive state with nervous irritability",
  ],

  "Iris versicolor": [
    "violent burning along the alimentary canal",
    "acid vomiting with burning sensation",
    "periodic sick headaches with nausea",
    "profuse salivation with gastric disturbance",
    "burning pains extending from stomach to mouth",
  ],

  Jaborandi: [
    "profuse salivation",
    "profuse sweating with weakness",
    "marked contraction of pupils",
    "blurred vision associated with excessive secretions",
    "headache with salivation and sweating",
  ],
    "Iberis amara": [
    "marked cardiac palpitation with anxiety",
    "sensation of constriction around the heart",
    "pain extending to left arm or shoulder",
    "cardiac symptoms aggravated by slight exertion",
    "digestive disturbance associated with heart complaints",
  ],

  "Ictodes foetida": [
    "marked digestive disturbance with offensive symptoms",
    "abdominal distension with flatulence",
    "nausea with gastric irritation",
    "offensive discharges from mucous membranes",
    "weakness associated with digestive disturbance",
  ],

  "Ignatia amara": [
    "marked emotional sensitivity with changeable symptoms",
    "grief or emotional shock followed by physical complaints",
    "spasmodic symptoms with contradictory manifestations",
    "sensation of a lump in the throat",
    "symptoms aggravated by emotional excitement",
  ],

  "Illicium anisatum": [
    "marked nervous excitement",
    "headache with dizziness",
    "digestive disturbance with nausea",
    "spasmodic abdominal complaints",
    "weakness with nervous irritability",
  ],

  "Indium metallicum": [
    "marked mental and physical exhaustion",
    "headache with pressure or heaviness",
    "sexual weakness with nervous exhaustion",
    "depression associated with weakness",
    "symptoms aggravated by mental exertion",
  ],

  Indigo: [
    "marked neuralgic pains",
    "severe headache with nervous irritation",
    "deep-seated abdominal pain",
    "spasmodic muscular symptoms",
    "mental depression with nervous exhaustion",
  ],

  Ingluvin: [
    "marked gastric weakness",
    "indigestion with heaviness after eating",
    "nausea with abdominal distension",
    "gastric complaints with poor digestion",
    "symptoms aggravated after rich or heavy food",
  ],

  "Inula helenium": [
    "marked respiratory catarrh",
    "cough with thick bronchial mucus",
    "chest oppression with difficult breathing",
    "urinary irritation with frequent urging",
    "digestive disturbance with abdominal discomfort",
  ],

  Iodium: [
    "marked restlessness with increased activity",
    "rapid emaciation despite good appetite",
    "glandular enlargement with wasting",
    "great intolerance of heat",
    "symptoms aggravated by rest and relieved by continued motion",
  ],

  Iodoformum: [
    "marked wasting and emaciation",
    "offensive mucous discharges",
    "ulcerative and destructive processes",
    "great nervous restlessness",
    "symptoms associated with chronic septic states",
  ],

  Ipecacuanha: [
    "persistent nausea out of proportion to vomiting",
    "clean tongue despite severe nausea",
    "spasmodic cough with nausea or vomiting",
    "bronchial complaints with wheezing",
    "symptoms aggravated by warm humid conditions",
  ],

  "Ipomoea purpurea": [
    "marked digestive disturbance",
    "nausea with abdominal cramps",
    "watery diarrhoea with weakness",
    "headache associated with gastric complaints",
    "symptoms aggravated after eating",
  ],

  "Iris florentina": [
    "marked headache with gastric disturbance",
    "nausea associated with digestive complaints",
    "burning sensations in stomach",
    "bitter taste with digestive upset",
    "neuralgic pains with gastrointestinal symptoms",
  ],

  "Iris foetidissima": [
    "marked digestive disturbance",
    "nausea with abdominal discomfort",
    "offensive discharges",
    "headache associated with gastric irritation",
    "weakness with digestive complaints",
  ],

  "Iris germanica": [
    "marked burning pains in digestive tract",
    "nausea with gastric irritation",
    "headache associated with digestive disturbance",
    "profuse salivation with gastric symptoms",
    "neuralgic pains with burning sensations",
  ],

  Iridium: [
    "marked nervous exhaustion",
    "severe neuralgic pains",
    "headache with mental fatigue",
    "weakness following prolonged exertion",
    "depressive state with nervous irritability",
  ],

  "Iris versicolor": [
    "violent burning along the alimentary canal",
    "acid vomiting with burning sensation",
    "periodic sick headaches with nausea",
    "profuse salivation with gastric disturbance",
    "burning pains extending from stomach to mouth",
  ],

  Jaborandi: [
    "profuse salivation",
    "profuse sweating with weakness",
    "marked contraction of pupils",
    "blurred vision associated with excessive secretions",
    "headache with salivation and sweating",
  ],
    "Kali manganicum": [
    "marked anaemic weakness",
    "glandular enlargement with induration",
    "neuralgic pains with weakness",
    "palpitations with exhaustion",
    "symptoms associated with chronic inflammatory states",
  ],

  "Kali nitricum": [
    "marked burning pains",
    "stitching and cutting pains",
    "respiratory complaints with difficult breathing",
    "urinary irritation with frequent urging",
    "symptoms aggravated by movement",
  ],

  "Kali oxalicum": [
    "violent neuralgic pains",
    "severe abdominal cramps",
    "painful muscular spasms",
    "great prostration with weakness",
    "symptoms aggravated by movement",
  ],

  "Kali phosphoricum": [
    "marked nervous exhaustion",
    "mental fatigue with poor concentration",
    "headache from mental exertion",
    "muscular weakness with trembling",
    "insomnia associated with nervous exhaustion",
  ],

  "Kali sulphuricum": [
    "yellow mucous discharges",
    "migrating or shifting pains",
    "catarrhal complaints with thick yellow mucus",
    "skin eruptions with desquamation",
    "symptoms aggravated by warmth and relieved by cool air",
  ],

  "Kalmia latifolia": [
    "severe neuralgic pains extending downward",
    "rheumatic pains associated with cardiac symptoms",
    "heart complaints with slow or irregular pulse",
    "pain aggravated by movement",
    "pain radiating from chest or heart toward shoulder or arm",
  ],

  Kaolin: [
    "marked weakness with anaemic tendency",
    "digestive disturbance with abdominal discomfort",
    "constipation with sluggish bowel action",
    "headache associated with weakness",
    "general prostration with poor vitality",
  ],

  Kino: [
    "marked haemorrhagic tendency",
    "profuse bleeding from mucous membranes",
    "bleeding gums with soreness",
    "haemorrhoidal bleeding with weakness",
    "great prostration following blood loss",
  ],

  Kissingen: [
    "marked digestive weakness",
    "gastric complaints with bloating",
    "constipation with abdominal discomfort",
    "bilious symptoms with headache",
    "digestive complaints aggravated after heavy food",
  ],

  Kreosotum: [
    "offensive acrid discharges",
    "uterine bleeding with offensive character",
    "rapid destructive dental decay",
    "burning and itching of mucous membranes",
    "complaints aggravated during menstrual period",
  ],

  "Lac caninum": [
    "marked changeable or alternating symptoms",
    "sore throat shifting from one side to the other",
    "extreme sensitivity with emotional instability",
    "feelings of worthlessness or self-doubt",
    "symptoms aggravated before or during menstruation",
  ],

  "Lac defloratum": [
    "severe headache with nausea",
    "headache associated with menstrual disturbance",
    "constipation with weakness",
    "marked nervous exhaustion",
    "symptoms aggravated by motion and improved by rest",
  ],

  "Lac felinum": [
    "marked visual disturbances",
    "headache with eye strain",
    "sensitivity to light and sensory impressions",
    "nervous irritability with restlessness",
    "symptoms associated with menstrual disturbance",
  ],

  "Lachesis": [
    "left-sided complaints with tendency to extend to the right",
    "marked intolerance of tight clothing around the neck",
    "symptoms worse after sleep",
    "talkativeness with rapid flow of thoughts",
    "menopausal or menstrual complaints with congestive symptoms",
  ],

  "Lachnanthes tinctoria": [
    "marked torticollis with neck stiffness",
    "rheumatic pains with stiffness",
    "sensation of heat and burning in affected parts",
    "headache associated with neck and shoulder tension",
    "pain aggravated by movement",
  ],

  "Lactic acid": [
    "marked muscular and joint pains",
    "rheumatic pains with stiffness",
    "great weakness with digestive disturbance",
    "nausea with sour or acid stomach symptoms",
    "symptoms aggravated by physical exertion",
  ],

  "Lactuca virosa": [
    "marked nervous restlessness",
    "insomnia with inability to remain still",
    "delirious or confused mental state",
    "spasmodic cough with chest oppression",
    "muscular twitching with weakness",
  ],

  "Lamium album": [
    "marked uterine and menstrual complaints",
    "profuse or irregular menstruation",
    "pelvic weakness with bearing-down sensation",
    "vaginal discharge with irritation",
    "leg pains associated with menstrual disturbance",
  ],
    "Lapis albus": [
    "marked glandular enlargement",
    "hard nodular or indurated swellings",
    "thyroid enlargement with pressure symptoms",
    "painful glandular complaints",
    "symptoms associated with chronic induration",
  ],

  "Lappa arctium": [
    "marked skin eruptions with itching",
    "eczema with offensive discharge",
    "glandular swelling associated with skin complaints",
    "scalp eruptions with itching",
    "chronic skin complaints with digestive disturbance",
  ],

  "Lappa major": [
    "marked skin eruptions with itching",
    "eczema with offensive or acrid discharge",
    "glandular enlargement",
    "scalp complaints with crusting eruptions",
    "skin symptoms associated with digestive disturbance",
  ],

  "Latrodectus mactans": [
    "violent constricting chest pain",
    "severe cardiac or precordial pain radiating to arm",
    "great anxiety with cardiac symptoms",
    "extreme restlessness during attacks",
    "marked weakness following severe pain",
  ],

  "Lathyrus sativus": [
    "marked paralysis of lower limbs",
    "spastic weakness with stiffness",
    "difficulty walking with exaggerated reflexes",
    "neurological weakness without corresponding sensory loss",
    "symptoms aggravated by continued exertion",
  ],

  Laurocerasus: [
    "marked respiratory weakness",
    "sensation of suffocation with cyanotic tendency",
    "weak pulse with great prostration",
    "coldness of extremities",
    "cardiac symptoms with difficult breathing",
  ],

  Lecithin: [
    "marked weakness with poor nutrition",
    "anaemic tendency with exhaustion",
    "loss of weight and vitality",
    "mental fatigue with poor concentration",
    "weakness associated with prolonged illness",
  ],

  "Ledum palustre": [
    "puncture wounds with marked soreness",
    "rheumatic pains beginning in lower limbs and moving upward",
    "coldness of affected parts despite pain",
    "pain aggravated by warmth and relieved by cold applications",
    "gouty pains with swollen joints",
  ],

  "Lemna minor": [
    "marked nasal obstruction",
    "nasal polyps with difficulty breathing through nose",
    "thick nasal discharge",
    "loss or diminution of smell",
    "nasal complaints worse in warm surroundings",
  ],

  "Lepidium bonariense": [
    "marked urinary irritation",
    "frequent urging to urinate",
    "burning during urination",
    "renal or bladder discomfort",
    "urinary complaints with pelvic weakness",
  ],

  "Leptandra virginica": [
    "marked liver and digestive disturbance",
    "black tarry stools",
    "bilious diarrhoea with abdominal pain",
    "bitter taste with nausea",
    "weakness associated with hepatic complaints",
  ],

  "Lilium tigrinum": [
    "marked pelvic bearing-down sensation",
    "constant urge to support or hold up pelvic organs",
    "uterine complaints with restlessness",
    "cardiac symptoms associated with uterine disturbance",
    "sexual excitement with emotional irritability",
  ],

  "Linum catharticum": [
    "marked watery diarrhoea",
    "intestinal irritation with abdominal cramps",
    "weakness following frequent stools",
    "digestive complaints with nausea",
    "symptoms aggravated after eating",
  ],

  "Lithium muriaticum": [
    "marked rheumatic and joint pains",
    "cardiac complaints with weakness",
    "urinary irritation",
    "glandular or inflammatory complaints",
    "symptoms aggravated by movement",
  ],

  "Lithium carbonicum": [
    "marked cardiac and rheumatic complaints",
    "headache associated with eye strain",
    "joint pains with stiffness",
    "urinary irritation with frequent urging",
    "symptoms aggravated by movement and mental exertion",
  ],

  "Lobelia cardinalis": [
    "marked respiratory oppression",
    "spasmodic cough with difficult breathing",
    "cardiac palpitation with weakness",
    "nausea associated with respiratory complaints",
    "great prostration during attacks",
  ],

  "Lobelia syphilitica": [
    "marked respiratory complaints",
    "spasmodic cough with chest oppression",
    "throat irritation with difficulty swallowing",
    "urinary disturbance with burning",
    "great weakness associated with respiratory symptoms",
  ],

  "Lobelia inflata": [
    "marked nausea with vomiting",
    "sensation of oppression and constriction of chest",
    "difficult breathing with spasmodic symptoms",
    "great weakness with faintness",
    "nausea aggravated by slightest movement",
  ],

  Lupulus: [
    "marked nervous excitement followed by exhaustion",
    "insomnia with restless sleep",
    "headache associated with gastric disturbance",
    "dizziness with mental dullness",
    "symptoms aggravated by excessive stimulation",
  ],

  "Lycopersicum": [
    "marked headache with eye pain",
    "rheumatic pains with muscular soreness",
    "pain aggravated by movement and touch",
    "digestive disturbance with abdominal discomfort",
    "symptoms associated with hypersensitivity to external impressions",
  ],
    "Lycopus virginicus": [
    "marked cardiac palpitation with rapid pulse",
    "thyroid enlargement with cardiac symptoms",
    "sensation of constriction in chest",
    "respiratory oppression associated with palpitation",
    "symptoms aggravated by exertion",
  ],

  Lyssin: [
    "marked sensitivity to water or sight of water",
    "violent spasmodic or convulsive symptoms",
    "extreme nervous excitability",
    "sudden impulsive or aggressive behaviour",
    "symptoms aggravated by noise, light or touch",
  ],

  "Magnetis polus arcticus": [
    "marked neuralgic pains",
    "rheumatic pains with stiffness",
    "alternating or shifting pains",
    "symptoms aggravated by movement",
    "marked muscular weakness with painful sensations",
  ],

  "Magnetis polus australis": [
    "marked neuralgic pains",
    "rheumatic pains with stiffness",
    "wandering or alternating pains",
    "muscular weakness with soreness",
    "symptoms aggravated by movement",
  ],

  "Magnesia carbonica": [
    "marked nervous irritability with weakness",
    "neuralgic pains especially at night",
    "digestive disturbance with sour eructations",
    "menstrual complaints with abdominal cramps",
    "symptoms aggravated by rest and relieved by movement",
  ],

  "Magnesia muriatica": [
    "marked liver and digestive complaints",
    "constipation with hard dry stool",
    "menstrual disturbance with uterine symptoms",
    "right-sided abdominal or hepatic complaints",
    "symptoms aggravated before menstruation",
  ],

  "Magnetis poli ambo": [
    "marked neuralgic pains",
    "rheumatic pains with stiffness",
    "alternating symptoms between opposite sides",
    "muscular weakness with soreness",
    "symptoms aggravated by movement",
  ],

  "Magnesia phosphorica": [
    "violent neuralgic pains",
    "cramps relieved by warmth and pressure",
    "spasmodic abdominal pain",
    "menstrual cramps with marked nervous sensitivity",
    "pain better from firm pressure and heat",
  ],

  "Magnesia sulphurica": [
    "marked muscular and rheumatic pains",
    "digestive disturbance with diarrhoeal tendency",
    "menstrual complaints with pelvic discomfort",
    "weakness associated with fluid imbalance",
    "symptoms aggravated by movement",
  ],

  Malandrinum: [
    "marked skin eruptions with itching",
    "eczema with crusting and scaling",
    "skin complaints associated with vaccination history",
    "chronic itching with dry eruptions",
    "general weakness associated with skin symptoms",
  ],

  "Malaria officinalis": [
    "periodic attacks with chills and fever",
    "marked headache associated with periodic fever",
    "great weakness following febrile attacks",
    "malarial-type intermittent complaints",
    "symptoms recurring at characteristic intervals",
  ],

  Mancinella: [
    "marked nervous excitement",
    "fearful or suspicious mental state",
    "violent spasmodic symptoms",
    "skin eruptions with intense itching",
    "symptoms aggravated by touch",
  ],

  "Manganum muriaticum": [
    "marked glandular and mucous membrane complaints",
    "hoarseness with throat irritation",
    "bone and joint pains with weakness",
    "anaemic tendency with exhaustion",
    "symptoms aggravated by cold",
  ],

  Manganum: [
    "marked bone and joint pains",
    "hoarseness with laryngeal irritation",
    "pain aggravated by cold air",
    "marked weakness with anaemic tendency",
    "rheumatic complaints with stiffness",
  ],

  Medorrhinum: [
    "marked restlessness with intense activity",
    "strong desire for stimulants or unusual foods",
    "chronic genito-urinary complaints",
    "symptoms with marked sexual excitement",
    "complaints often worse before thunderstorms or at night",
  ],

  "Melilotus alba": [
    "marked vascular congestion with headache",
    "throbbing headache with flushed face",
    "nosebleed associated with congestive headache",
    "headache relieved by profuse bleeding",
    "restlessness with vascular excitement",
  ],

  Menispermum: [
    "marked headache with neck and scalp soreness",
    "stiffness of neck with muscular pain",
    "headache aggravated by movement",
    "rheumatic pains with stiffness",
    "drowsiness associated with headache",
  ],

  "Mentha piperita": [
    "marked burning sensations",
    "digestive disturbance with flatulence",
    "nausea with abdominal discomfort",
    "respiratory complaints with cool sensation",
    "headache associated with gastric disturbance",
  ],

  Menyanthes: [
    "marked neuralgic headache with periodic attacks",
    "pain with cold sensation in affected parts",
    "rheumatic pains with stiffness",
    "digestive complaints with weakness",
    "symptoms aggravated by movement",
  ],
    Mephitis: [
    "violent spasmodic cough with suffocative attacks",
    "cough worse at night and during sleep",
    "respiratory complaints with chest oppression",
    "great sensitivity to external stimuli",
    "offensive secretions associated with respiratory complaints",
  ],

  "Mercurius aceticus": [
    "marked mucous membrane inflammation",
    "burning and ulcerative throat complaints",
    "profuse salivation with offensive breath",
    "glandular swelling with tenderness",
    "great weakness with inflammatory symptoms",
  ],

  "Mercurius corrosivus": [
    "violent burning pains of mucous membranes",
    "tenesmus with severe rectal irritation",
    "frequent painful urination with burning",
    "bloody and acrid discharges",
    "rapid destructive inflammation with great prostration",
  ],

  "Mercurius cyanatus": [
    "destructive ulceration of throat",
    "severe membranous or necrotic throat inflammation",
    "profuse salivation with offensive breath",
    "difficulty swallowing with great weakness",
    "rapidly developing toxic or septic appearance",
  ],

  "Mercurius dulcis": [
    "catarrhal complaints with thick mucus",
    "swollen lymphatic glands",
    "ear complaints with mucous obstruction",
    "digestive disturbance with sluggishness",
    "mild mercurial symptoms with glandular involvement",
  ],

  "Mercurius iodatus flavus": [
    "right-sided throat complaints",
    "yellow-coated tongue with throat inflammation",
    "swollen tonsils and cervical glands",
    "difficulty swallowing with glandular enlargement",
    "thick yellow mucous discharge",
  ],

  "Mercurius iodatus ruber": [
    "left-sided throat complaints",
    "marked tonsillar inflammation",
    "swollen cervical glands",
    "difficulty swallowing with burning",
    "thick mucous discharge with glandular involvement",
  ],

  "Mercurius nitrosus": [
    "marked ulcerative mucous membrane inflammation",
    "burning pains with offensive discharges",
    "profuse salivation",
    "throat and mouth ulceration",
    "great weakness with destructive inflammatory symptoms",
  ],

  "Mercurius praecipitatus ruber": [
    "violent inflammatory mucous membrane complaints",
    "burning and ulcerative lesions",
    "offensive discharges with salivation",
    "marked genital or urinary irritation",
    "great prostration with destructive inflammation",
  ],

  "Mercurius sulphuricus": [
    "marked glandular swelling",
    "profuse mucous discharges",
    "catarrhal complaints with thick mucus",
    "digestive disturbance with salivation",
    "weakness associated with chronic mucous membrane inflammation",
  ],

  "Mercurius vivus": [
    "profuse salivation with offensive breath",
    "swollen tender gums with dental sensitivity",
    "metallic taste with mouth ulceration",
    "marked perspiration without relief",
    "symptoms aggravated at night and by warmth of bed",
  ],

  Mercurialis: [
    "marked salivation with offensive breath",
    "mouth and throat inflammation",
    "swollen painful gums",
    "digestive disturbance with nausea",
    "weakness associated with mucous membrane irritation",
  ],

  Mezereum: [
    "violent neuralgic pains",
    "burning and itching skin eruptions",
    "thick crusts with pus beneath",
    "bone pains with marked sensitivity",
    "pain aggravated by touch and warmth",
  ],

  Millefolium: [
    "profuse bright-red haemorrhage",
    "bleeding from various mucous membranes",
    "haemorrhage after injury or exertion",
    "vascular congestion with weakness",
    "bleeding associated with abdominal or uterine complaints",
  ],

  "Mitchella repens": [
    "marked uterine and pregnancy-related complaints",
    "pelvic weakness with bearing-down sensation",
    "irregular uterine contractions",
    "backache associated with pelvic symptoms",
    "urinary irritation during pregnancy",
  ],

  Morphinum: [
    "marked drowsiness and stupor",
    "respiratory depression with slow breathing",
    "extreme sensitivity to external impressions",
    "mental confusion with vivid dreams",
    "constipation with diminished intestinal activity",
  ],

  Moschus: [
    "marked nervous excitement",
    "hysterical spasms with fainting",
    "sensation of suffocation with anxiety",
    "palpitations with trembling",
    "symptoms aggravated by emotional excitement",
  ],

  "Muriaticum acidum": [
    "marked prostration with extreme weakness",
    "mouth and throat ulceration",
    "dark or offensive haemorrhagic tendency",
    "painful haemorrhoids with burning",
    "symptoms occurring during severe febrile exhaustion",
  ],

  Murex: [
    "marked uterine and pelvic complaints",
    "bearing-down sensation with pelvic congestion",
    "marked sexual excitement",
    "uterine pain extending to breasts or other regions",
    "symptoms aggravated by movement or pressure",
  ],

  "Mygale lasiodora": [
    "marked spasmodic muscular movements",
    "chorea-like twitching and jerking",
    "restlessness with inability to keep still",
    "neuralgic pains with muscular contractions",
    "symptoms aggravated by emotional excitement",
  ],

  Myosotis: [
    "marked chronic respiratory catarrh",
    "persistent cough with thick mucus",
    "chest oppression with difficult breathing",
    "digestive disturbance with weakness",
    "symptoms associated with chronic mucous membrane irritation",
  ],

  "Myrica cerifera": [
    "marked hepatic and bilious complaints",
    "jaundiced appearance with weakness",
    "bitter taste with digestive disturbance",
    "headache associated with liver dysfunction",
    "yellow mucous discharges",
  ],

  "Myristica sebifera": [
    "marked suppurative tendency",
    "painful abscess formation",
    "deep-seated burning pains",
    "inflammation with tendency to rapid suppuration",
    "marked sensitivity and swelling of affected tissues",
  ],

  "Myrtus communis": [
    "marked respiratory complaints with chest oppression",
    "painful cough with thick mucus",
    "burning or stitching pain in chest",
    "genito-urinary complaints with irritation",
    "symptoms associated with mucous membrane inflammation",
  ],

  "Naja tripudia": [
    "marked cardiac complaints with palpitation",
    "constricting pain around heart or chest",
    "pain radiating to left arm",
    "great anxiety associated with cardiac symptoms",
    "symptoms aggravated by emotional excitement",
  ],
    Naphthalin: [
    "marked respiratory irritation with spasmodic symptoms",
    "nasal obstruction with catarrhal complaints",
    "burning irritation of mucous membranes",
    "headache associated with respiratory disturbance",
    "symptoms aggravated by inhaled irritants",
  ],

  Narcotinum: [
    "marked nervous excitement followed by exhaustion",
    "drowsiness with mental confusion",
    "respiratory weakness with oppression",
    "extreme sensitivity to external impressions",
    "sleep disturbances with vivid or restless dreams",
  ],

  "Natrum arsenicatum": [
    "marked weakness with anaemic tendency",
    "burning pains with restlessness",
    "skin eruptions with itching and burning",
    "respiratory complaints with weakness",
    "symptoms aggravated at night",
  ],

  "Natrum aceticum": [
    "marked digestive weakness",
    "acid stomach with nausea",
    "abdominal discomfort with flatulence",
    "weakness associated with poor digestion",
    "urinary disturbance with burning",
  ],

  "Natrum carbonicum": [
    "marked weakness from heat and sun",
    "headache aggravated by mental exertion",
    "digestive disturbance with bloating",
    "sensitivity to noise and external impressions",
    "symptoms aggravated by hot weather",
  ],

  "Natrum hypochlorosum": [
    "marked weakness with chronic mucous complaints",
    "digestive disturbance with abdominal discomfort",
    "respiratory catarrh with thick mucus",
    "urinary irritation with weakness",
    "craving for salt",
    "symptoms aggravated by sun and emotional stress",
  ],

  "Natrum nitricum": [
    "marked headache with nervous exhaustion",
    "digestive disturbance with acidity",
    "anaemic weakness with fatigue",
    "urinary irritation with burning",
    "symptoms aggravated by mental exertion",
  ],

  "Natrum phosphoricum": [
    "marked acidity with sour eructations",
    "sour vomiting or sour taste",
    "digestive disturbance after rich food",
    "headache associated with gastric acidity",
    "joint or rheumatic complaints associated with acid dyscrasia",
  ],

  "Natrum sulphuricum": [
    "marked liver and biliary complaints",
    "digestive disturbance with bilious symptoms",
    "symptoms aggravated by damp weather",
    "headache associated with hepatic disturbance",
    "depressive state with digestive or liver complaints",
  ],

  "Niccolum sulphuricum": [
    "marked neuralgic pains",
    "headache with nervous exhaustion",
    "rheumatic pains with stiffness",
    "weakness associated with chronic complaints",
    "symptoms aggravated by mental or physical exertion",
  ],

  Niccolum: [
    "marked nervous exhaustion",
    "headache associated with mental strain",
    "neuralgic pains with weakness",
    "irritability with oversensitivity",
    "symptoms aggravated by prolonged mental exertion",
  ],

  "Nitricum acidum": [
    "sharp splinter-like pains",
    "deep fissures and ulcerative lesions",
    "offensive discharges",
    "marked mucous membrane irritation",
    "symptoms aggravated by touch",
  ],

  "Nitro muriatic acid": [
    "marked hepatic and digestive disturbance",
    "yellowish discoloration with weakness",
    "mouth and throat ulceration",
    "offensive mucous discharges",
    "great prostration with chronic inflammatory symptoms",
  ],

  "Nitri spiritus dulcis": [
    "marked urinary irritation",
    "frequent urging to urinate",
    "burning during urination",
    "headache with nervous exhaustion",
    "respiratory irritation with chest discomfort",
  ],

  "Nitrogenium oxygenatum": [
    "marked nervous excitement",
    "headache with vascular congestion",
    "respiratory oppression",
    "palpitations with anxiety",
    "great weakness following nervous excitement",
  ],

  "Nuphar luteum": [
    "marked sexual weakness",
    "genital relaxation with loss of vitality",
    "digestive weakness with abdominal discomfort",
    "mental and physical exhaustion",
    "symptoms associated with diminished sexual function",
  ],

  "Nux juglans": [
    "marked digestive disturbance",
    "hepatic complaints with abdominal discomfort",
    "constipation with sluggish digestion",
    "headache associated with gastric or liver disturbance",
    "skin eruptions associated with digestive complaints",
  ],

  "Nux moschata": [
    "marked drowsiness with mental confusion",
    "extreme dryness of mouth and mucous membranes",
    "fainting or sudden loss of consciousness",
    "hysterical or changeable symptoms",
    "digestive complaints with bloating and sleepiness",
  ],

  "Nux vomica": [
    "marked irritability with oversensitivity",
    "spasmodic digestive complaints with nausea",
    "constipation with ineffectual urging",
    "symptoms aggravated by stimulants and excesses",
    "chilly state with marked sensitivity to cold",
  ],

  "Nymphaea odorata": [
    "marked uterine and menstrual complaints",
    "pelvic weakness with bearing-down sensation",
    "sexual weakness with diminished vitality",
    "urinary irritation with pelvic discomfort",
    "mental and physical exhaustion associated with genital symptoms",
  ],
    "Ocimum canum": [
    "marked urinary irritation",
    "renal or urethral pain with burning",
    "frequent urging to urinate",
    "urinary complaints with red or irritating urine",
    "digestive disturbance associated with urinary symptoms",
  ],

  "Oenanthe crocata": [
    "violent convulsive attacks",
    "sudden loss of consciousness",
    "spasmodic muscular contractions",
    "marked nervous excitement followed by exhaustion",
    "symptoms with cyanotic or suffocative tendency",
  ],

  "Oleum animale": [
    "marked neuralgic pains",
    "rheumatic and muscular pains",
    "digestive disturbance with weakness",
    "headache associated with nervous exhaustion",
    "symptoms aggravated by movement",
  ],

  "Oleum jecoris aselli": [
    "marked weakness with emaciation",
    "poor nutrition with loss of weight",
    "chronic respiratory complaints",
    "bone and glandular complaints with weakness",
    "general exhaustion with impaired assimilation",
  ],

  Oleander: [
    "marked cardiac weakness with palpitation",
    "weak or irregular pulse",
    "digestive complaints with nausea",
    "muscular weakness with trembling",
    "symptoms aggravated by slight exertion",
  ],

  Onosmodium: [
    "marked headache with eye strain",
    "pain behind the eyes",
    "mental and physical exhaustion",
    "sexual weakness with nervous fatigue",
    "spinal and muscular pains with weakness",
  ],

  Opium: [
    "marked stupor with diminished sensitivity",
    "slow respiration with deep sleep",
    "constipation with no desire or urging",
    "dryness and lack of reaction",
    "symptoms associated with suppression or shock",
  ],

  "Origanum majorana": [
    "marked nervous excitement",
    "sexual excitement with restlessness",
    "headache with mental overactivity",
    "neuralgic pains with nervous irritation",
    "symptoms aggravated by emotional excitement",
  ],

  Osmium: [
    "marked irritation of mucous membranes",
    "hoarseness with laryngeal sensitivity",
    "respiratory complaints with chest oppression",
    "headache with neuralgic character",
    "symptoms aggravated by strong odors or external irritation",
  ],

  Ovinine: [
    "marked uterine and menstrual complaints",
    "pelvic weakness with bearing-down sensation",
    "irregular menstrual bleeding",
    "genital weakness with exhaustion",
    "urinary complaints associated with pelvic symptoms",
  ],

  "Oxalicum acidum": [
    "violent neuralgic pains",
    "sudden sharp shooting pains",
    "numbness associated with neuralgia",
    "pain aggravated by movement",
    "marked weakness following severe pain",
  ],

  "Oxytropis lamberti": [
    "marked neurological weakness",
    "trembling and muscular incoordination",
    "mental confusion with weakness",
    "gastrointestinal disturbance with nervous symptoms",
    "progressive weakness with impaired coordination",
  ],

  "Ozone (Oxygenium)": [
    "marked respiratory irritation",
    "difficulty breathing with chest oppression",
    "headache associated with oxygen deprivation or congestion",
    "weakness with rapid exhaustion",
    "irritation of mucous membranes",
  ],

  "Paeonia officinalis": [
    "marked painful haemorrhoids",
    "fissures with burning and soreness",
    "ulcerative complaints with offensive discharge",
    "sacral pain associated with rectal symptoms",
    "symptoms aggravated by sitting",
  ],

  Palladium: [
    "marked self-esteem and recognition concerns",
    "irritability with emotional sensitivity",
    "pelvic and uterine complaints",
    "bearing-down sensation with pelvic weakness",
    "symptoms associated with menstrual disturbance",
  ],

  "Paris quadrifolia": [
    "marked occipital headache",
    "sensation of pressure or constriction in head",
    "eye strain with visual disturbances",
    "numbness or tingling of face and limbs",
    "symptoms aggravated by mental exertion",
  ],

  "Pareira brava": [
    "violent urinary pain",
    "intense urging with difficulty passing urine",
    "burning in urethra and bladder",
    "pain extending from bladder toward limbs",
    "urinary symptoms aggravated by sitting or movement",
  ],

  "Paullinia pinnata": [
    "marked nervous headache",
    "headache with mental exhaustion",
    "digestive disturbance associated with headache",
    "neuralgic pains with weakness",
    "symptoms aggravated by mental exertion",
  ],

  "Pediculus capitis": [
    "marked scalp itching",
    "crawling sensation on scalp",
    "restlessness associated with intense itching",
    "skin irritation from scratching",
    "headache associated with scalp irritation",
  ],

  Penthorum: [
    "marked nasal catarrh",
    "thick mucous discharge with nasal obstruction",
    "respiratory irritation with cough",
    "throat irritation with mucus",
    "symptoms aggravated by damp weather",
  ],
    Persica: [
    "marked cardiac palpitation with anxiety",
    "sensation of constriction around the heart",
    "headache associated with vascular congestion",
    "digestive disturbance with nausea",
    "weakness associated with cardiac symptoms",
  ],

  Petiveria: [
    "marked neuralgic pains",
    "rheumatic pains with stiffness",
    "painful muscular complaints",
    "nervous restlessness with weakness",
    "symptoms aggravated by movement",
  ],

  Petroleum: [
    "marked dryness and fissuring of skin",
    "eczema with deep painful cracks",
    "skin complaints worse in winter",
    "motion sickness with nausea",
    "digestive complaints with intense hunger",
  ],

  Petroselinum: [
    "marked urinary irritation",
    "sudden irresistible urging to urinate",
    "burning and itching in urethra",
    "genital irritation with urinary symptoms",
    "symptoms aggravated by prolonged sitting",
  ],

  "Phosphoricum acidum": [
    "marked mental and physical exhaustion",
    "indifference after grief or prolonged emotional strain",
    "weakness with poor concentration",
    "headache from mental exertion",
    "painless watery discharges with prostration",
  ],

  "Phallus impudicus": [
    "marked sexual excitement",
    "persistent genital irritation",
    "headache associated with sexual symptoms",
    "nervous restlessness with weakness",
    "symptoms associated with excessive sexual stimulation",
  ],

  "Phaseolus nanus": [
    "marked cardiac palpitation",
    "rapid or irregular pulse",
    "sensation of cardiac weakness",
    "chest oppression with anxiety",
    "palpitation aggravated by exertion",
  ],

  Phellandrium: [
    "marked respiratory catarrh",
    "profuse thick bronchial mucus",
    "painful cough with difficult expectoration",
    "breast and chest complaints with burning pain",
    "respiratory symptoms associated with lactation",
  ],

  Phosphorus: [
    "marked thirst for cold drinks",
    "easy bleeding with bright-red blood",
    "burning sensations with weakness",
    "marked sensitivity to external impressions",
    "respiratory complaints with chest oppression",
  ],

  Physostigma: [
    "marked eye strain with visual disturbance",
    "spasm or twitching of ocular muscles",
    "constricted pupils with visual symptoms",
    "muscular twitching and spasms",
    "nervous weakness with tremulousness",
  ],

  "Phytolacca decandra": [
    "marked dark-red or bluish throat inflammation",
    "burning throat with difficulty swallowing",
    "pain radiating from throat to ears",
    "breast complaints with hard painful induration",
    "bone and muscular pains with fever",
  ],

  "Picricum acidum": [
    "marked nervous exhaustion from mental work",
    "burning pains along spine",
    "headache with mental fatigue",
    "great weakness after intellectual exertion",
    "depressive state with profound prostration",
  ],

  "Pimpinella saxifraga": [
    "marked respiratory irritation",
    "spasmodic cough with chest oppression",
    "thick bronchial mucus",
    "digestive disturbance with flatulence",
    "urinary irritation with weakness",
  ],

  "Pinus sylvestris": [
    "marked rheumatic and muscular pains",
    "bone pains with weakness",
    "respiratory complaints with chest oppression",
    "urinary irritation with frequent urging",
    "symptoms aggravated by movement",
  ],

  "Piper methysticum": [
    "marked nervous excitement followed by weakness",
    "muscular relaxation with fatigue",
    "digestive disturbance with nausea",
    "urinary irritation",
    "mental confusion with nervous exhaustion",
  ],

  "Piper nigrum": [
    "marked burning sensations",
    "violent neuralgic pains",
    "digestive irritation with abdominal cramps",
    "respiratory irritation with spasmodic cough",
    "symptoms aggravated by warmth",
  ],

  "Plantago major": [
    "marked neuralgic toothache",
    "earache with shooting pains",
    "nerve pain with hypersensitivity",
    "urinary irritation with frequent urging",
    "pain aggravated by touch",
  ],

  "Platinum muriaticum": [
    "marked nervous irritability",
    "pelvic and uterine complaints",
    "sexual excitement with exhaustion",
    "neuralgic pains with numbness",
    "symptoms associated with menstrual disturbance",
  ],

  "Platinum metallicum": [
    "marked pride and emotional sensitivity",
    "pelvic complaints with uterine congestion",
    "sexual excitement with nervous exhaustion",
    "numbness and neuralgic pains",
    "symptoms aggravated by emotional excitement",
  ],

  "Plumbum metallicum": [
    "marked paralysis and muscular weakness",
    "extreme constipation with ineffectual urging",
    "abdominal retraction or sinking sensation",
    "neuralgic pains with numbness",
    "progressive weakness with sluggish mental state",
  ],

  Plectranthus: [
    "marked digestive disturbance",
    "abdominal discomfort with flatulence",
    "nausea with gastric irritation",
    "respiratory catarrh with thick mucus",
    "weakness associated with digestive complaints",
  ],

  "Plumbago littoralis": [
    "marked digestive weakness",
    "abdominal cramps with constipation",
    "burning digestive complaints",
    "urinary irritation with burning",
    "general weakness associated with digestive disturbance",
  ],
    "Podophyllum peltatum": [
    "profuse watery offensive diarrhoea",
    "early morning diarrhoea with sudden urging",
    "stool expelled with great force",
    "marked weakness following diarrhoea",
    "prolapse of rectum associated with violent diarrhoea",
  ],

  "Polygonum hydropiperoides": [
    "marked urinary irritation",
    "burning during urination",
    "frequent urging with bladder discomfort",
    "pelvic congestion with urinary symptoms",
    "digestive disturbance with abdominal discomfort",
  ],

  "Populus tremuloides": [
    "marked urinary irritation",
    "frequent urging to urinate",
    "burning in bladder and urethra",
    "headache associated with urinary complaints",
    "symptoms aggravated by cold",
  ],

  "Pothos foetidus": [
    "marked throat and mouth irritation",
    "burning sensation of mucous membranes",
    "difficulty swallowing with throat inflammation",
    "nasal catarrh with obstruction",
    "respiratory irritation with cough",
  ],

  "Prunus padus": [
    "marked neuralgic pains",
    "headache with nervous irritation",
    "respiratory complaints with chest oppression",
    "palpitation with anxiety",
    "digestive disturbance with weakness",
  ],

  "Prunus spinosa": [
    "violent neuralgic pains",
    "sharp shooting pains along nerves",
    "severe eye pain with headache",
    "cardiac or chest pains with constriction",
    "pain aggravated by slightest movement or touch",
  ],

  "Psorinum": [
    "marked hypersensitivity to cold",
    "offensive body odour or discharges",
    "chronic itching with recurrent skin complaints",
    "great weakness despite adequate food",
    "symptoms aggravated before storms or during weather changes",
  ],

  "Ptelea trifoliata": [
    "marked gastric weakness",
    "digestive disturbance with nausea",
    "liver complaints with heaviness",
    "headache associated with gastric symptoms",
    "symptoms aggravated after eating",
  ],

  "Pulsatilla nuttalliana": [
    "changeable and shifting symptoms",
    "mild emotional sensitivity with weepiness",
    "thirstlessness despite dryness or fever",
    "digestive complaints aggravated by rich fatty food",
    "symptoms better in cool open air",
  ],

  "Pulsatilla nigricans": [
    "marked changeability of symptoms",
    "mild weepy temperament with need for consolation",
    "thirstlessness with complaints",
    "symptoms aggravated by rich fatty food",
    "symptoms better in cool open air and gentle movement",
  ],

  "Pulex irritans": [
    "intense itching with crawling sensation",
    "skin irritation aggravated by scratching",
    "restlessness associated with itching",
    "sensitive skin with burning or stinging",
    "symptoms worse at night",
  ],

  Pyrogenium: [
    "marked septic or toxic state",
    "great restlessness with profound weakness",
    "offensive discharges",
    "rapid pulse disproportionate to temperature",
    "sensation of extreme soreness throughout the body",
  ],

  "Pyrus americana": [
    "marked uterine and pelvic complaints",
    "pelvic congestion with bearing-down sensation",
    "menstrual irregularity with weakness",
    "urinary irritation associated with pelvic symptoms",
    "backache with uterine complaints",
  ],

  Radium: [
    "marked bone and joint pains",
    "deep-seated aching with weakness",
    "skin irritation with burning or itching",
    "great fatigue following exertion",
    "symptoms aggravated by movement",
  ],

  "Ranunculus acris": [
    "marked neuralgic and rheumatic pains",
    "burning and stinging skin sensations",
    "pain aggravated by touch",
    "muscular soreness with stiffness",
    "symptoms aggravated by damp weather",
  ],

  "Ranunculus bulbosus": [
    "violent intercostal neuralgic pains",
    "stitching pains in chest",
    "pain aggravated by slightest movement or touch",
    "vesicular eruptions with burning",
    "rheumatic pains with marked muscular soreness",
  ],

  "Ranunculus sceleratus": [
    "marked burning skin irritation",
    "vesicular and pustular eruptions",
    "violent burning pains of mucous membranes",
    "skin symptoms aggravated by touch",
    "ulcerative complaints with burning",
  ],

  Raphanus: [
    "marked abdominal distension with trapped gas",
    "flatulence that cannot be expelled",
    "violent abdominal colic",
    "digestive complaints with bloating",
    "symptoms associated with intestinal obstruction-like distension",
  ],
    Ratanhia: [
    "violent burning pain after stool",
    "anal fissures with sharp cutting pain",
    "dry hard stool with rectal soreness",
    "hemorrhoids with burning and constriction",
    "pain lasting long after defecation",
  ],

  Rheum: [
    "sour smelling stools and perspiration",
    "restless irritable children",
    "colic with ineffectual urging",
    "body smells distinctly sour",
    "diarrhoea with sour odor",
  ],

  Rhododendron: [
    "rheumatic pains before storms",
    "pain aggravated by change of weather",
    "testicular pain with neuralgia",
    "joint stiffness in cold damp weather",
    "symptoms worse before thunderstorm",
  ],

  "Rhus aromatica": [
    "urinary incontinence in children",
    "frequent urination with weakness",
    "bladder irritation",
    "pelvic relaxation",
    "urinary symptoms worse at night",
  ],

  "Rhus glabra": [
    "aphthous ulcers with sore mouth",
    "swollen inflamed gums",
    "excessive salivation",
    "mouth and throat ulceration",
    "offensive oral inflammation",
  ],

  "Rhus radicans": [
    "vesicular itching eruptions",
    "rheumatic stiffness relieved by motion",
    "complaints after getting wet",
    "burning skin with swelling",
    "restlessness with muscular pain",
  ],

  // Rhus toxicodendron → ALREADY EXISTS

  "Rhus venenata": [
    "intense oedematous skin swelling",
    "violent burning and itching",
    "vesicular dermatitis",
    "skin worse from contact",
    "extreme hypersensitivity of skin",
  ],

  "Robinia pseudacacia": [
    "intense hyperacidity",
    "sour vomiting and sour eructations",
    "night gastric acidity",
    "frontal headache from acidity",
    "acid dyspepsia in children",
  ],

  "Rumex crispus": [
    "dry teasing cough from cold air",
    "cough excited by uncovering",
    "tickling in suprasternal fossa",
    "must cover mouth while breathing",
    "cough worse inhaling cold air",
  ],

  "Ruta graveolens": [
    "injury to tendons and periosteum",
    "eye strain from close work",
    "stiff bruised feeling",
    "sprains with lingering soreness",
    "pain worse from overuse",
  ],

  Sabadilla: [
    "violent sneezing with itching nose",
    "hay fever with watery discharge",
    "imaginary sensation of worms",
    "throat tickling with cough",
    "symptoms better from warmth",
  ],

  "Sabal serrulata": [
    "prostatic enlargement",
    "frequent nocturnal urination",
    "sexual weakness with prostate symptoms",
    "urinary dribbling",
    "pelvic heaviness",
  ],

  Sabina: [
    "bright red uterine bleeding with clots",
    "pain from sacrum to pubes",
    "miscarriage tendency around third month",
    "profuse menstrual hemorrhage",
    "bleeding aggravated by slightest motion",
  ],

  "Saccharum lactis": [
    "digestive disturbance from milk sugar",
    "acid fermentation with bloating",
    "restless irritable children",
    "flatulence with sour stools",
    "intestinal weakness",
  ],

  "Saccharum album": [
    "craving for sweets",
    "digestive disturbance after sugar",
    "obesity with sluggish metabolism",
    "mental irritability after eating sweets",
    "flatulence with fermentation",
  ],

  "Salicylicum acidum": [
    "ringing in ears with deafness",
    "rheumatic pains with fever",
    "profuse offensive perspiration",
    "influenza with muscular soreness",
    "vertigo with tinnitus",
  ],

  "Salix niger": [
    "sexual excitement with nervous weakness",
    "ovarian and uterine irritation",
    "insomnia from sexual erethism",
    "pelvic congestion",
    "genital weakness with irritability",
  ],
    Salamander: [
    "extreme sensitivity to heat",
    "burning and itching of skin",
    "skin complaints aggravated by warmth",
    "vesicular eruptions with burning",
    "symptoms better from cold applications",
  ],

  "Sambucus nigra": [
    "sudden suffocative attacks at night",
    "nasal obstruction with inability to breathe",
    "profuse sweat with dry skin",
    "violent spasmodic cough at night",
    "child wakes suffocating and gasping",
  ],

  "Sanguinaria nitrica": [
    "burning pains with gastric disturbance",
    "right-sided headaches with periodicity",
    "burning of mucous membranes",
    "nasal catarrh with burning discharge",
    "headache relieved by sleep",
  ],

  "Sanguinaria canadensis": [
    "right-sided migraine with periodic attacks",
    "burning sensation of palms and soles",
    "climacteric hot flushes",
    "burning gastric acidity",
    "headache beginning in occiput and settling over right eye",
  ],

  "Sanicula aqua": [
    "offensive perspiration of feet",
    "cracks and fissures of skin",
    "changeable thirst with alternating desires",
    "profuse offensive discharges",
    "constipation with hard dry stool",
  ],

  Santoninum: [
    "visual disturbances with colored vision",
    "worms with grinding of teeth",
    "abdominal pain from intestinal parasites",
    "urinary irritation with spasms",
    "marked nervous irritability",
  ],

  "Sarracenia purpurea": [
    "violent headache with gastric disturbance",
    "influenza-like state with muscular soreness",
    "nasal obstruction with headache",
    "digestive disturbance with weakness",
    "heavy dull feeling of head",
  ],

  Sarsaparilla: [
    "violent burning at end of urination",
    "painful urination with sand or gravel",
    "urine passes in drops with severe pain",
    "renal colic with urinary irritation",
    "eczema with urinary complaints",
  ],

  "Scutellaria lateriflora": [
    "nervous exhaustion with trembling",
    "insomnia from nervous excitement",
    "restless sleep with vivid dreams",
    "headache from mental overwork",
    "nervous weakness with muscular twitching",
  ],

  "Secale cornutum": [
    "dark passive uterine hemorrhage",
    "thin watery offensive blood",
    "cold body with desire for cold air",
    "violent burning despite external coldness",
    "hemorrhagic states with collapse and restlessness",
  ],

  Selenium: [
    "marked sexual weakness with exhaustion",
    "prostatic complaints with dribbling urine",
    "hoarseness after slight use of voice",
    "extreme fatigue after mental or physical exertion",
    "oily offensive skin with weakness",
  ],

  "Senecio aureus": [
    "urinary irritation with frequent urination",
    "cough associated with urinary symptoms",
    "menstrual irregularity with respiratory complaints",
    "kidney and bladder irritation",
    "burning urination with pelvic discomfort",
  ],

  Senega: [
    "profuse bronchial mucus difficult to expel",
    "sharp stitching pain in chest",
    "dry painful cough with rattling mucus",
    "weakness after respiratory illness",
    "eye complaints with rheumatic symptoms",
  ],

  Senna: [
    "colic with flatulent distension",
    "constipation with abdominal cramping",
    "irritability associated with digestive disturbance",
    "bloating with difficult stool",
    "intestinal weakness with gas",
  ],

  // Sepia → ALREADY EXISTS

  Serpentaria: [
    "violent gastric burning",
    "nausea with vomiting",
    "headache with gastric disturbance",
    "burning pains in stomach and abdomen",
    "digestive complaints with marked weakness",
  ],

  Silicea: [
    "deep-seated suppuration with tendency to expel foreign bodies",
    "extreme chilliness with lack of vital heat",
    "offensive foot perspiration",
    "constipation with stool receding after partial expulsion",
    "weakness with hypersensitivity to cold",
  ],

  "Sinapis alba": [
    "dry irritating nasal catarrh",
    "burning and sneezing from nasal irritation",
    "headache associated with coryza",
    "throat irritation with dryness",
    "respiratory complaints from mustard-like irritation",
  ],

  "Sinapis nigra": [
    "burning nasal discharge with sneezing",
    "dry irritating cough",
    "burning sensation of throat",
    "headache with catarrhal symptoms",
    "mucous membrane irritation with burning",
  ],

  "Solanum mammosum": [
    "painful skin eruptions with itching",
    "neuralgic pains with restlessness",
    "burning and tingling sensations",
    "spasmodic muscular symptoms",
    "nervous irritation with skin complaints",
  ],

  "Solanum nigrum": [
    "violent headache with delirium",
    "restlessness with nervous excitement",
    "spasmodic muscular contractions",
    "burning sensations with fever",
    "marked sensitivity to light and noise",
  ],

  "Solanum oleraceum": [
    "digestive disturbance with abdominal pain",
    "burning gastric symptoms",
    "nervous irritability with weakness",
    "headache associated with gastric complaints",
    "general weakness with digestive upset",
  ],
    "Solanum tuberosum aegrotans": [
    "violent nervous excitement with restlessness",
    "headache with strange mental sensations",
    "spasmodic muscular symptoms",
    "burning sensations with nervous irritability",
    "marked weakness after acute symptoms",
  ],

  "Solidago virgaurea": [
    "kidney pain with urinary irritation",
    "soreness over kidneys",
    "frequent urination with scanty urine",
    "burning during urination",
    "urinary symptoms with backache",
  ],

  "Spigelia marilandica": [
    "violent left-sided neuralgic headache",
    "stitching pain through heart region",
    "palpitation with anxiety",
    "pain extending from neck to face",
    "extreme sensitivity to touch and movement",
  ],

  "Spigelia anthelmia": [
    "violent neuralgic facial pains",
    "left-sided headache with eye pain",
    "palpitation with sharp cardiac pains",
    "worms with abdominal symptoms",
    "pain worse from slightest movement",
  ],

  Spiranthes: [
    "uterine and menstrual disorders",
    "painful menstruation with pelvic congestion",
    "ovarian irritation",
    "urinary irritation associated with pelvic symptoms",
    "nervous symptoms accompanying uterine complaints",
  ],

  "Spongia tosta": [
    "dry barking croupy cough",
    "dryness of larynx and air passages",
    "sensation of a plug in larynx",
    "cough worse before midnight",
    "respiratory symptoms better from warm drinks",
  ],

  "Squilla hispanica": [
    "violent exhausting cough with expectoration",
    "stitching pain in chest",
    "profuse watery nasal discharge",
    "involuntary urination during cough",
    "respiratory complaints worse from cold air",
  ],

  "Stachys betonica": [
    "nervous exhaustion with headache",
    "digestive disturbance with abdominal discomfort",
    "menstrual irregularity",
    "muscular weakness with trembling",
    "restlessness with general debility",
  ],

  "Stannum metallicum": [
    "profound weakness from slightest exertion",
    "chest weakness with difficult speech",
    "empty sinking sensation in chest",
    "deep hollow cough with exhaustion",
    "pains gradually increase and gradually decrease",
  ],

  Staphysagria: [
    "ailments from suppressed anger and indignation",
    "extreme sensitivity to insult",
    "stinging pains with marked nervous sensitivity",
    "urinary complaints after sexual excess",
    "surgical or incised wounds with hypersensitivity",
  ],

  "Stellaria media": [
    "rheumatic pains with stiffness",
    "muscular soreness with aching",
    "joint pains aggravated by movement",
    "headache with rheumatic complaints",
    "general weakness with aching limbs",
  ],

  "Sticta pulmonaria": [
    "constant desire to blow the nose without discharge",
    "frontal headache with nasal obstruction",
    "dryness of nasal mucosa",
    "dry irritating cough from postnasal sensation",
    "symptoms worse at night",
  ],

  "Stillingia sylvatica": [
    "syphilitic bone pains",
    "deep aching pains in bones",
    "headache with periosteal soreness",
    "throat irritation with burning",
    "rheumatic pains with marked bone involvement",
  ],

  Stramonium: [
    "violent delirium with fear and terror",
    "fear of darkness and being alone",
    "loquacity with rapid speech",
    "spasms with rigidity and jerking",
    "symptoms worse in darkness and better from light",
  ],

  Strontium: [
    "bone pains with marked soreness",
    "chronic ulcers with burning",
    "rheumatic pains with stiffness",
    "headache with pressure sensation",
    "complaints after injury with lingering soreness",
  ],

  "Strophanthus hispidus": [
    "cardiac weakness with palpitation",
    "irregular weak pulse",
    "dyspnoea from slight exertion",
    "dropsical swelling with heart weakness",
    "cardiac symptoms with anxiety",
  ],

  Strychninum: [
    "extreme nervous irritability",
    "violent muscular spasms",
    "tetanic rigidity with convulsive movements",
    "heightened sensitivity to external impressions",
    "spasms aggravated by slightest stimulus",
  ],

  "Sulphuricum acidum": [
    "great weakness with rapid collapse",
    "burning pains with corrosive sensations",
    "hemorrhagic tendency with dark blood",
    "marked acidity with digestive complaints",
    "great haste with weakness and trembling",
  ],

  "Sulphur iodatum": [
    "chronic glandular enlargement",
    "burning itching skin eruptions",
    "persistent catarrhal complaints",
    "weakness with chronic inflammatory states",
    "skin symptoms aggravated by warmth",
  ],

  // Sulphur → ALREADY EXISTS

  Sumbul: [
    "nervous palpitations with anxiety",
    "hysterical and nervous symptoms",
    "sensation of constriction in chest",
    "headache with nervous exhaustion",
    "digestive complaints from nervous disturbance",
  ],
    "Symphoricarpus racemosus": [
    "persistent nausea during pregnancy",
    "nausea with inability to retain food",
    "morning sickness with extreme weakness",
    "uterine complaints associated with nausea",
    "digestive disturbance with constant nausea",
  ],

  "Symphytum officinale": [
    "painful injuries of bones and periosteum",
    "non-union of fractures",
    "neuralgic pain after bone injury",
    "traumatic eye injury",
    "deep soreness after injury",
  ],

  Syphilinum: [
    "destructive ulcerative tendency",
    "severe bone pains worse at night",
    "restlessness with insomnia",
    "deep chronic destructive complaints",
    "symptoms recurring in periodic cycles",
  ],

  Tabacum: [
    "extreme nausea with cold sweat",
    "deathly nausea with vomiting",
    "pallor with faintness and collapse",
    "vertigo better from fresh air",
    "cold sweat with severe prostration",
  ],

  "Tanacetum vulgare": [
    "violent muscular twitching",
    "spasmodic nervous symptoms",
    "menstrual disorders with pelvic congestion",
    "headache with nervous irritability",
    "restlessness with muscular excitement",
  ],

  Tanninum: [
    "marked astringent tendency",
    "profuse mucous discharges requiring contraction",
    "intestinal diarrhoea with weakness",
    "hemorrhagic tendency",
    "soreness of mucous membranes",
  ],

  Taraxacum: [
    "liver and digestive disturbance",
    "bitter taste with coated map-like tongue",
    "gastric complaints with belching",
    "urinary complaints with digestive weakness",
    "wandering rheumatic pains with digestive symptoms",
  ],

  "Tarentula cubensis": [
    "violent suppurative inflammation",
    "intense burning pains in abscesses",
    "extreme restlessness with destructive inflammation",
    "dark offensive suppuration",
    "severe pain with toxic-looking local inflammation",
  ],

  "Tarentula hispanica": [
    "extreme restlessness requiring constant motion",
    "violent impulsive behavior with rapid movements",
    "music produces marked excitement",
    "hysterical states with dancing or sudden activity",
    "symptoms relieved by rapid motion",
  ],

  "Tartaricum acidum": [
    "great weakness with respiratory symptoms",
    "difficult breathing with rattling mucus",
    "weak cough unable to expel mucus",
    "prostration during chest complaints",
    "coldness with circulatory weakness",
  ],

  "Taxus baccata": [
    "violent gastric irritation",
    "burning pains with vomiting",
    "respiratory oppression with chest constriction",
    "neuralgic pains with restlessness",
    "marked weakness with toxic symptoms",
  ],

  Tellurium: [
    "extremely offensive body odor",
    "offensive ear discharges",
    "offensive genital discharges",
    "itching with foul-smelling eruptions",
    "strong tendency to offensive secretions",
  ],

  Teplitz: [
    "rheumatic pains with stiffness",
    "chronic skin eruptions",
    "digestive complaints with weakness",
    "joint pains aggravated by damp weather",
    "chronic complaints with general debility",
  ],

  Terebinthina: [
    "burning pain in urinary tract",
    "dark smoky urine with urinary irritation",
    "marked renal congestion",
    "hemorrhagic urinary symptoms",
    "great abdominal distension with tympanites",
  ],

  "Teucrium marum verum": [
    "violent itching in anus",
    "threadworms with rectal irritation",
    "nasal polyps with obstruction",
    "constant desire to rub or scratch affected parts",
    "mucous membrane irritation with polypoid growths",
  ],

  Thallium: [
    "rapid progressive weakness",
    "severe neuralgic pains",
    "paralytic symptoms with numbness",
    "rapid loss of hair",
    "burning and tingling of extremities",
  ],

  "Thea sinensis": [
    "nervous excitement with insomnia",
    "palpitation with anxiety",
    "headache from mental overactivity",
    "trembling with nervous exhaustion",
    "digestive disturbance from tea stimulation",
  ],

  Theridion: [
    "extreme sensitivity to noise",
    "vertigo from slightest sound",
    "headache with nausea from noise",
    "motion sickness with nervous sensitivity",
    "spinal and neuralgic pains with hypersensitivity",
  ],

  "Thlaspi bursa pastoris": [
    "profuse uterine hemorrhage",
    "bright red bleeding with clots",
    "hemorrhage after delivery",
    "menstrual bleeding with pelvic pain",
    "bleeding with marked weakness",
  ],

  "Thuja occidentalis": [
    "fixed ideas and obsessive thoughts",
    "feeling of something alive moving inside",
    "warts and condylomatous growths",
    "complaints after vaccination",
    "marked sensitivity with secretive mental state",
  ],

  "Tilia europaea": [
    "neuralgic facial pains",
    "headache with pressure sensation",
    "rheumatic pains in muscles and joints",
    "burning or itching skin complaints",
    "nervous irritability with headache",
  ],

  Tongo: [
    "spasmodic respiratory complaints",
    "violent cough with chest constriction",
    "neuralgic pains with muscular tension",
    "nervous excitement with restlessness",
    "headache with respiratory disturbance",
  ],

  "Trifolium pratense": [
    "nervous headache with mental excitement",
    "menstrual disorders with pelvic symptoms",
    "glandular enlargement",
    "restlessness with insomnia",
    "rheumatic pains with nervous irritability",
  ],

  "Trillium pendulum": [
    "profuse bright red uterine hemorrhage",
    "bleeding aggravated by slightest movement",
    "sensation that hips and pelvis are falling apart",
    "uterine hemorrhage with faintness",
    "heavy bearing-down pelvic sensation",
  ],

  "Triosteum perfoliatum": [
    "digestive disturbance with vomiting",
    "constipation with abdominal discomfort",
    "liver complaints with jaundice",
    "rheumatic pains with digestive symptoms",
    "general weakness with gastric disturbance",
  ],

  "Trombidium muscae domesticae": [
    "intense itching with skin eruptions",
    "burning stinging skin sensations",
    "restlessness from severe itching",
    "red inflamed eruptions",
    "symptoms aggravated by warmth",
  ],

  Tuberculinum: [
    "constant desire for change and travel",
    "restlessness with dissatisfaction",
    "rapid changeability of symptoms",
    "great sensitivity to environmental influences",
    "recurrent respiratory complaints with weakness",
  ],

  "Tussilago fragrans": [
    "persistent cough with respiratory irritation",
    "dry irritating cough",
    "bronchial catarrh with difficult expectoration",
    "chest oppression with cough",
    "weakness following prolonged cough",
  ],

  "Tussilago petasites": [
    "spasmodic cough with chest irritation",
    "bronchial catarrh",
    "headache associated with respiratory complaints",
    "difficult expectoration",
    "respiratory symptoms with weakness",
  ],

  "Upas tiente": [
    "violent muscular spasms",
    "tetanic rigidity",
    "convulsions triggered by slight stimuli",
    "extreme nervous excitability",
    "spasms with marked muscular contraction",
  ],

  "Uranium nitricum": [
    "marked weakness with wasting",
    "excessive thirst and urination",
    "digestive complaints with burning",
    "sexual weakness with exhaustion",
    "deep chronic weakness with urinary symptoms",
  ],

  "Urtica urens": [
    "burning stinging urticarial eruptions",
    "intense itching with wheals",
    "urticaria with burning sensation",
    "breast complaints with deficient milk secretion",
    "rheumatic pains with burning stinging sensation",
  ],

  "Ustilago maydis": [
    "uterine hemorrhage with dark blood",
    "profuse menstrual bleeding",
    "fibroid tendency with hemorrhage",
    "sexual excitement with pelvic congestion",
    "bleeding aggravated around menstrual period",
  ],

  "Uva ursi": [
    "burning painful urination",
    "frequent urging to urinate",
    "bloody urine with bladder irritation",
    "vesical tenesmus",
    "urinary complaints with burning and soreness",
  ],

  Vaccininum: [
    "chronic complaints following vaccination",
    "headache with nervous disturbance",
    "skin eruptions after vaccination",
    "glandular swelling after vaccination",
    "persistent weakness following vaccination",
  ],

  Valeriana: [
    "extreme nervous excitability",
    "hysterical restlessness",
    "wandering neuralgic pains",
    "symptoms worse from emotional excitement",
    "sensation of internal trembling",
  ],

  Variolinum: [
    "preventive remedy associated with smallpox exposure",
    "severe headache with feverish state",
    "skin eruptions with constitutional weakness",
    "bone and muscular pains during fever",
    "marked prostration with eruptive illness",
  ],

  "Veratrum viride": [
    "violent congestive headache",
    "high fever with rapid pulse",
    "flushed face with circulatory excitement",
    "vomiting with prostration",
    "inflammatory states with strong vascular excitement",
  ],

  "Veratrum album": [
    "violent vomiting and watery diarrhoea",
    "cold sweat on forehead",
    "extreme collapse with coldness",
    "intense thirst for cold water",
    "restlessness with prostration",
  ],

  "Verbascum thapsus": [
    "violent neuralgic facial pain",
    "earache with shooting pains",
    "pressure sensation in face",
    "dry irritating cough",
    "pain worse from touch and movement",
  ],

  "Vespa crabro": [
    "burning stinging pains",
    "oedematous swelling of skin",
    "urticarial eruptions with intense itching",
    "ovarian and uterine complaints",
    "symptoms aggravated by touch",
  ],

  "Viburnum opulus": [
    "violent spasmodic menstrual cramps",
    "painful menstruation with uterine spasm",
    "cramping extending to thighs",
    "pelvic pain with bearing-down sensation",
    "menstrual pain with nausea and faintness",
  ],

  "Vinca minor": [
    "offensive scalp eruptions",
    "itching scalp with matting of hair",
    "eczema with burning and itching",
    "bleeding from skin eruptions",
    "skin complaints with offensive discharge",
  ],
    "Viola odorata": [
    "violent frontal headache with nasal catarrh",
    "hoarseness with dry irritating cough",
    "left-sided facial neuralgia",
    "earache with shooting pains",
    "respiratory complaints with thick mucus",
  ],

  "Viola tricolor": [
    "cradle cap with thick crusts",
    "eczema with offensive discharge",
    "skin eruptions on face and scalp",
    "urinary irritation with skin complaints",
    "children with chronic eczematous eruptions",
  ],

  Vipera: [
    "marked venous congestion",
    "extreme sensitivity of affected parts",
    "bursting sensation in veins",
    "pain worse when affected limb hangs down",
    "venous complaints with throbbing pain",
  ],

  "Viscum album": [
    "hypertensive headache with vertigo",
    "rheumatic pains with stiffness",
    "cardiac palpitations with dyspnoea",
    "neuralgic pains with jerking sensations",
    "symptoms associated with circulatory disturbance",
  ],

  Wiesbaden: [
    "chronic rheumatic pains",
    "joint stiffness with muscular soreness",
    "digestive weakness with chronic complaints",
    "skin eruptions with rheumatic symptoms",
    "general debility with aching pains",
  ],

  Wildbad: [
    "chronic rheumatic joint pains",
    "stiffness aggravated by damp weather",
    "muscular soreness with weakness",
    "digestive disturbance with rheumatic complaints",
    "chronic constitutional weakness",
  ],

  "Wyethia helenioides": [
    "intense itching and burning of throat",
    "dry tickling sensation in throat",
    "constant desire to clear throat",
    "nasal catarrh with throat irritation",
    "throat symptoms aggravated by talking",
  ],

  "Xanthoxylum fraxineum": [
    "violent neuralgic pains",
    "right-sided headache with facial neuralgia",
    "painful menstruation with ovarian neuralgia",
    "shooting pains along nerves",
    "menstrual complaints with severe backache",
  ],

  Yucca: [
    "violent frontal headache",
    "burning and dryness of throat",
    "catarrhal respiratory complaints",
    "rheumatic pains with stiffness",
    "digestive disturbance with headache",
  ],

  "Zincum aceticum": [
    "extreme nervous exhaustion",
    "restlessness of feet",
    "twitching and jerking muscles",
    "headache with mental exhaustion",
    "symptoms aggravated by suppressed eruptions",
  ],

  "Zincum cyanatum": [
    "violent nervous restlessness",
    "constant movement of feet",
    "neuralgic pains with twitching",
    "spasmodic muscular symptoms",
    "marked nervous exhaustion",
  ],

  "Zincum muriaticum": [
    "extreme nervous exhaustion",
    "restlessness with constant movement of feet",
    "spinal weakness with neuralgic pains",
    "muscular twitching and jerking",
    "symptoms from suppressed eruptions",
  ],

  "Zincum oxydatum": [
    "nervous exhaustion with restlessness",
    "constant movement of feet",
    "spinal irritation with weakness",
    "muscular twitching",
    "headache with nervous fatigue",
  ],

  "Zincum sulphuricum": [
    "nervous exhaustion with tremulous weakness",
    "restlessness of lower limbs",
    "muscular twitching and jerking",
    "headache from nervous strain",
    "digestive disturbance with nervous weakness",
  ],

  "Zincum metallicum": [
    "extreme nervous exhaustion",
    "constant restless movement of feet",
    "spinal weakness with trembling",
    "muscular twitching and jerking",
    "complaints after suppression of eruptions",
  ],

  Zingiber: [
    "burning gastric pain",
    "violent nausea with digestive disturbance",
    "flatulence with abdominal distension",
    "burning sensation along digestive tract",
    "headache associated with gastric complaints",
  ],

  "Zizia aurea": [
    "spasmodic nervous symptoms",
    "twitching and jerking muscles",
    "headache with vertigo",
    "neuralgic pains with nervous excitability",
    "restlessness with muscular symptoms",
  ],
};

function confirmRemedies(topRemedies, symptoms) {
  const confirmationResults = [];

  for (const remedyName of topRemedies) {
    const canonicalName = resolveCanonicalRemedyName(remedyName);

    const profileNameMap = {
      "RHUS TOXICODENDRON": "Rhus toxicodendron",
      "ARSENICUM ALBUM": "Arsenicum album",
      "CHAMOMILLA": "Chamomilla",
      "CONIUM MACULATUM": "Conium maculatum",
      "LYCOPODIUM CLAVATUM": "Lycopodium",
      "CALCAREA CARBONICA": "Calcarea carb",
      "NATRUM MURIATICUM": "Natrum muriaticum",
      "NAT-M": "Natrum muriaticum",
      "PULSATILLA": "Pulsatilla",
      "PULS": "Pulsatilla",
      "LYCOPODIUM": "Lycopodium",
      "PHOSPHORUS": "Phosphorus",
      "SULPHUR": "Sulphur",
      "NUX VOMICA": "Nux vomica",

      "STAPH": "Staphylococcinum",
      "AUR": "Aurum metallicum",
      "CAUST": "Causticum",
      "LACH": "Lachesis",
      "IGN": "Ignatia",
      "PH-AC": "Phosphoricum acidum",
      "TARENT": "Tarentula hispanica",
      "COLOC": "Colocynthis",
      "COCC": "Cocculus indicus",
      "HYOS": "Hyoscyamus",
      "SEP": "Sepia",
      "GELS": "Gelsemium",
      "BELL": "Belladonna",
      "ANT-C": "Antimonium crudum",
      "MERC": "Mercurius solubilis",
      "APIS": "Apis mellifica",
      "CALC-P": "Calcarea phosphorica",
      "PLAT": "Platina",
      "AM-M": "Ammonium muriaticum",
      "CYCL": "Cyclamen",
      "VERAT": "Veratrum album",
      "OP": "Opium",
      "LIL-T": "Lilium tigrinum",
      "ACET-AC": "Aceticum acidum",
      "ACON": "Aconitum",
      "AGAR": "Agaricus muscarius",
      "ALUM": "Alumina",
      "AM-C": "Ammonium carbonicum",
      "BAR-C": "Baryta carbonica",
      "CARB-AN": "Carbo animalis",
      "LACT": "Lac caninum",
      "SUL-AC": "Sulphuricum acidum",
      "ANAC": "Anacardium",
      "CLEM": "Clematis erecta",
      "COLCH": "Colchicum",
      "KALI-P": "Kali phosphoricum",
      "LOB-C": "Lobelia inflata",
      "NAJA": "Naja tripudians",
      "NIT-AC": "Nitricum acidum",
      "BRY": "Bryonia",
      "CARB-V": "Carbo vegetabilis",
      "PAR": "Paris quadrifolia",
      "SANG": "Sanguinaria",
      "CHIN": "China officinalis",
      "SPIG": "Spigelia"
    };

    const canonicalLookupKey = String(canonicalName || "").trim().toUpperCase();
    const remedyLookupKey = String(remedyName || "").trim().toUpperCase();

    const normalizedRemedyName =
      profileNameMap[canonicalLookupKey] ||
      profileNameMap[remedyLookupKey] ||
      canonicalName ||
      remedyName;
    const remedyKeynotes = keynoteProfiles[normalizedRemedyName];
    if (!remedyKeynotes) {
      console.warn(`Keynote profile not found for remedy: ${remedyName}`);
      continue;
    }

    const normalizeWords = (text) =>
      String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(word => word.length > 2 && !["from","the","and","for","with","after","before","about","like","yet"].includes(word))
        .map(word => word.endsWith("ing") ? word.slice(0, -3) : word)
        .map(word => word.endsWith("ed") ? word.slice(0, -2) : word);

    const keywordFamilies = {
      crav: ["crav", "crave", "craves", "craving"],
      salt: ["salt", "salty"],
      weak: ["weak", "weakness", "weakened"],
      depress: ["depress", "depression", "depressed"],
      grief: ["grief", "grieving", "grieve"],
      sleep: ["sleep", "sleeping", "sleepless"],
      headach: ["headache", "headaches"],
      sun: ["sun", "sunlight"],
      cold: ["cold", "chilly", "chill"],
      stiffness: ["stiff", "stiffness"],
      muscle: ["muscle", "muscles", "muscular"],
      cough: ["cough", "coughing"],
      urinary: ["urinary", "urine", "urination"],
      wart: ["wart", "warts"],
      growth: ["growth", "growing"],
      bone: ["bone", "bones"],
      thirst: ["thirst", "thirstless"],
      weep: ["weep", "weeping", "weeps"],
      change: ["change", "changeable"],
      air: ["air"],
      flatulence: ["flatulence", "flatulent"],
      distension: ["distension", "distended"],
      collapse: ["collapse", "collapsed"],
      sweat: ["sweat", "sweating"],
      anxiety: ["anxiety", "anxious"],
      restlessness: ["restless", "restlessness"],
      guilt: ["guilt", "guilty"],
      despair: ["despair", "despairing"],
      cardiac: ["cardiac", "heart"],
      pain: ["pain", "pains", "painful"]
    };

    const expandClinicalWords = (words) => {
      const expanded = new Set(words);

      for (const word of words) {
        for (const [family, variants] of Object.entries(keywordFamilies)) {
          if (variants.includes(word) || word === family) {
            expanded.add(family);
            variants.forEach(v => expanded.add(v));
          }
        }
      }

      return expanded;
    };

    // 9F-71: Controlled clinical semantic concept groups.
    // These groups are used ONLY for semantic deduplication.
    // They do not alter the existing keynote matcher.
    const clinicalConceptGroups = [
      {
        id: "HAMMERING_HEADACHE",
        phrases: [
          "headaches like hammer blows",
          "headache with periodic or hammering pain"
        ]
      }
    ];

    // 9F-74: Resolve a matched keynote to its controlled semantic concept.
    // Returns null when the keynote does not belong to a concept group.
    const getSemanticConceptId = (keynote) => {
      const normalizeConceptPhrase = (text) =>
        String(text || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const normalizedKeynote = normalizeConceptPhrase(keynote);
      if (!normalizedKeynote) return null;

      const group = clinicalConceptGroups.find((concept) =>
        concept.phrases.some((phrase) =>
          normalizeConceptPhrase(phrase) === normalizedKeynote
        )
      );

      return group ? group.id : null;
    };

    // 9F-48: Controlled clinical phrase equivalences.
    // These are deliberately phrase-specific to avoid broad false positives.
    const clinicalPhraseEquivalences = [
      ["aggravation from consolation", "worse from consolation"],
      ["aggravation from heat", "worse from heat"],
      ["uncleanliness", "feels unclean"],
      ["sour perspiration", "sour sweat"],
      ["anxiety about health", "anxious about health"],
      ["craving for indigestible things", "craves things that cannot be digested"],
      ["headaches like hammer blows", "hammering headache"]
    ];

    const phraseEquivalent = (a, b) => {
      const normalizePhrase = (text) =>
        String(text || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const x = normalizePhrase(a);
      const y = normalizePhrase(b);

      if (!x || !y) return false;
      if (x === y) return true;

      return clinicalPhraseEquivalences.some(([left, right]) =>
        (x === left && y === right) ||
        (x === right && y === left)
      );
    };

    const matchedKeynotes = remedyKeynotes.filter((keynote) => {
      const keynoteText = String(keynote || "").trim().toLowerCase();
      const keynoteWords = normalizeWords(keynoteText);
      const keynoteExpanded = expandClinicalWords(keynoteWords);

      return symptoms.some((symptom) => {
        const symptomText = String(symptom || "").trim().toLowerCase();
        const symptomWords = normalizeWords(symptomText);
        const symptomExpanded = expandClinicalWords(symptomWords);

        // 1. Strongest match: normalized phrase containment.
        const normalizedKeynotePhrase = keynoteWords.join(" ");
        const normalizedSymptomPhrase = symptomWords.join(" ");

        if (
          normalizedKeynotePhrase &&
          normalizedSymptomPhrase &&
          (
            normalizedSymptomPhrase.includes(normalizedKeynotePhrase) ||
            normalizedKeynotePhrase.includes(normalizedSymptomPhrase)
          )
        ) {
          return true;
        }

        // 1B. Controlled clinical phrase equivalence.
        // Exact phrase pairs only; prevents broad synonym false positives.
        if (
          phraseEquivalent(
            keynoteText,
            symptomText
          )
        ) {
          return true;
        }

        // 2. Count clinically meaningful family overlaps.
        const matchedFamilies = new Set();

        for (const [family, variants] of Object.entries(keywordFamilies)) {
          const keynoteHasFamily =
            keynoteWords.includes(family) ||
            variants.some(v => keynoteWords.includes(v));

          const symptomHasFamily =
            symptomWords.includes(family) ||
            variants.some(v => symptomWords.includes(v));

          if (keynoteHasFamily && symptomHasFamily) {
            matchedFamilies.add(family);
          }
        }

        // 3. Single-concept keynotes can match directly.
        const meaningfulKeynoteWords = [...keynoteExpanded].filter(
          word => word.length > 3
        );

        if (meaningfulKeynoteWords.length <= 1) {
          return meaningfulKeynoteWords.some(word =>
            symptomExpanded.has(word)
          );
        }

        // 4. Multi-word keynote requires at least TWO
        // clinically meaningful concepts/families.
        //
        // Generic families such as bone/pain/weakness/air/cold
        // are not sufficient by themselves because they commonly
        // occur across unrelated remedy keynotes.
        const genericFamilies = new Set([
          "bone",
          "pain",
          "weak",
          "cold",
          "air",
          "sleep",
          "sweat",
          "muscle",
          "growth"
        ]);

        const discriminativeFamilies = [...matchedFamilies].filter(
          family => !genericFamilies.has(family)
        );

        if (
          matchedFamilies.size >= 2 &&
          discriminativeFamilies.length >= 1
        ) {
          return true;
        }

        // 5. Direct overlap of two words is allowed only when
        // at least one overlapping word is clinically specific.
        const genericWords = new Set([
          "bone",
          "bones",
          "pain",
          "pains",
          "weak",
          "weakness",
          "cold",
          "air",
          "sleep",
          "sweat",
          "muscle",
          "muscles",
          "growth"
        ]);

        const directMeaningfulOverlap = keynoteWords.filter(word =>
          word.length > 3 &&
          symptomWords.includes(word) &&
          !genericWords.has(word)
        );

        return directMeaningfulOverlap.length >= 2;
      });
    });
    const missingKeynotes = remedyKeynotes.filter(
      (keynote) => !matchedKeynotes.includes(keynote)
    );

    // 9F-75: Semantic concept deduplication for scoring only.
    // matchedKeynotes remains the raw clinical evidence.
    const semanticConceptIds = new Set();

    for (const keynote of matchedKeynotes) {
      const conceptId = getSemanticConceptId(keynote);

      if (conceptId) {
        semanticConceptIds.add(conceptId);
      } else {
        // Keynotes without a controlled concept remain independently countable.
        semanticConceptIds.add(`KEYNOTE:${String(keynote).toLowerCase()}`);
      }
    }


    // 9F-81B: Build the denominator using the same semantic units
    // used by semanticMatchCount. This prevents mixing semantic
    // numerator with raw keynote denominator.
    const allSemanticConceptIds = new Set();

    for (const keynote of remedyKeynotes) {
      const conceptId = getSemanticConceptId(keynote);

      if (conceptId) {
        allSemanticConceptIds.add(conceptId);
      } else {
        // Unmapped keynotes remain independently countable.
        allSemanticConceptIds.add(`KEYNOTE:${String(keynote).toLowerCase()}`);
      }
    }

    const semanticKeynoteCount = allSemanticConceptIds.size;
    const semanticMatchCount = semanticConceptIds.size;
    const numMatched = semanticMatchCount;
    let confidence;
    let confirmationScore = semanticKeynoteCount > 0
      ? (numMatched / semanticKeynoteCount) * 100
      : 0;

    if (numMatched >= 5) {
      confidence = "Very High";
    } else if (numMatched >= 3) {
      confidence = "High";
    } else if (numMatched === 2) {
      confidence = "Moderate";
    } else if (numMatched === 1) {
      confidence = "Low";
    } else {
      confidence = "None";
      confirmationScore = 0;
    }

    confirmationResults.push({
      remedy: remedyName,
      matchedKeynotes,
      missingKeynotes,
      confidence,
      confirmationScore: Math.round(confirmationScore),
    });
  }

  return confirmationResults;
}

module.exports = {
  confirmRemedies,
};




















