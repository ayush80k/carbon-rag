import type { BhoomiLanguage } from "../language.js";

export type { BhoomiLanguage } from "../language.js";

export interface BhoomiKnowledgeDocument {
  id: string;
  source: string;
  section: string;
  lang: BhoomiLanguage;
  text: string;
}

const source = "Bhoomi Carbon multilingual knowledge base";

const entries: Array<Omit<BhoomiKnowledgeDocument, "id" | "source">> = [
  { lang: "en", section: "What is Bhoomi Carbon?", text: "Bhoomi Carbon does not generate or verify carbon credits. It works with already-issued, registry-verified carbon credits and provides transparent platform-level pricing and quality information." },
  { lang: "hi", section: "Bhoomi Carbon क्या है?", text: "Bhoomi Carbon स्वयं कार्बन क्रेडिट उत्पन्न या सत्यापित नहीं करता। यह पहले से जारी, रजिस्ट्री-सत्यापित कार्बन क्रेडिट के साथ काम करता है और प्लेटफ़ॉर्म स्तर की पारदर्शी कीमत व गुणवत्ता जानकारी देता है।" },
  { lang: "pa", section: "Bhoomi Carbon ਕੀ ਹੈ?", text: "Bhoomi Carbon ਖੁਦ ਕਾਰਬਨ ਕ੍ਰੈਡਿਟ ਤਿਆਰ ਜਾਂ ਤਸਦੀਕ ਨਹੀਂ ਕਰਦਾ। ਇਹ ਪਹਿਲਾਂ ਜਾਰੀ ਹੋਏ, ਰਜਿਸਟਰੀ-ਤਸਦੀਕਸ਼ੁਦਾ ਕਾਰਬਨ ਕ੍ਰੈਡਿਟਾਂ ਨਾਲ ਕੰਮ ਕਰਦਾ ਹੈ ਅਤੇ ਪਲੇਟਫਾਰਮ ਪੱਧਰ ਦੀ ਪਾਰਦਰਸ਼ੀ ਕੀਮਤ ਤੇ ਗੁਣਵੱਤਾ ਜਾਣਕਾਰੀ ਦਿੰਦਾ ਹੈ।" },
  { lang: "mr", section: "Bhoomi Carbon म्हणजे काय?", text: "Bhoomi Carbon स्वतः कार्बन क्रेडिट तयार किंवा पडताळत नाही. ते आधीच जारी केलेल्या, रजिस्ट्री-पडताळलेल्या कार्बन क्रेडिट्ससह काम करते आणि प्लॅटफॉर्म-स्तरीय पारदर्शक किंमत व गुणवत्तेची माहिती देते." },

  { lang: "en", section: "What is a carbon credit?", text: "A carbon credit represents one tonne of CO2 equivalent that has been removed or whose emissions have been prevented or reduced under the applicable carbon-crediting framework and registry methodology." },
  { lang: "hi", section: "कार्बन क्रेडिट क्या है?", text: "कार्बन क्रेडिट एक टन CO2 समतुल्य का प्रतिनिधित्व करता है जिसे हटाया गया है, या जिसके उत्सर्जन को लागू कार्बन-क्रेडिटिंग ढांचे और रजिस्ट्री पद्धति के अनुसार रोका या कम किया गया है।" },
  { lang: "pa", section: "ਕਾਰਬਨ ਕ੍ਰੈਡਿਟ ਕੀ ਹੈ?", text: "ਕਾਰਬਨ ਕ੍ਰੈਡਿਟ ਇੱਕ ਟਨ CO2 ਸਮਤੁਲ ਨੂੰ ਦਰਸਾਉਂਦਾ ਹੈ ਜੋ ਹਟਾਇਆ ਗਿਆ ਹੈ ਜਾਂ ਜਿਸ ਦੇ ਉਤਸਰਜਨ ਨੂੰ ਲਾਗੂ ਕਾਰਬਨ-ਕ੍ਰੈਡਿਟਿੰਗ ਢਾਂਚੇ ਅਤੇ ਰਜਿਸਟਰੀ ਪੱਧਤੀ ਅਨੁਸਾਰ ਰੋਕਿਆ ਜਾਂ ਘਟਾਇਆ ਗਿਆ ਹੈ।" },
  { lang: "mr", section: "कार्बन क्रेडिट म्हणजे काय?", text: "कार्बन क्रेडिट म्हणजे एक टन CO2 समतुल्य, जे काढून टाकले गेले आहे किंवा ज्याचे उत्सर्जन लागू कार्बन-क्रेडिटिंग चौकट आणि रजिस्ट्री पद्धतीनुसार टाळले किंवा कमी केले गेले आहे." },

  { lang: "en", section: "Project types and methodologies", text: "REDD+ concerns reducing emissions from deforestation and forest degradation. IFM is Improved Forest Management. ARR is Afforestation, Reforestation and Revegetation. Biochar stores carbon in stable biomass-derived material. ERW is Enhanced Rock Weathering. DAC is Direct Air Capture. Project methodologies define how a registry framework accounts for the activity; Bhoomi Carbon does not independently validate them." },
  { lang: "hi", section: "परियोजना प्रकार और पद्धतियाँ", text: "REDD+ वनों की कटाई और वन क्षरण से उत्सर्जन घटाने से जुड़ा है। IFM बेहतर वन प्रबंधन है। ARR वनीकरण, पुनर्वनीकरण और वनस्पति पुनर्स्थापन है। Biochar जैव-द्रव्य से बने स्थिर पदार्थ में कार्बन को संग्रहित करता है। ERW उन्नत शैल अपक्षय है। DAC प्रत्यक्ष वायु ग्रहण है। पद्धतियाँ रजिस्ट्री ढांचे में गतिविधि का लेखांकन बताती हैं; Bhoomi Carbon उन्हें स्वतंत्र रूप से मान्य नहीं करता।" },
  { lang: "pa", section: "ਪ੍ਰੋਜੈਕਟ ਕਿਸਮਾਂ ਅਤੇ ਪੱਧਤੀਆਂ", text: "REDD+ ਜੰਗਲ ਕਟਾਈ ਅਤੇ ਜੰਗਲ ਖ਼ਰਾਬੀ ਤੋਂ ਉਤਸਰਜਨ ਘਟਾਉਣ ਨਾਲ ਸਬੰਧਿਤ ਹੈ। IFM ਸੁਧਾਰਿਆ ਜੰਗਲ ਪ੍ਰਬੰਧਨ ਹੈ। ARR ਵਨੀਕਰਨ, ਮੁੜ-ਵਨੀਕਰਨ ਅਤੇ ਵਨਸਪਤੀਕਰਨ ਹੈ। Biochar ਸਥਿਰ ਜੈਵ-ਪਦਾਰਥ ਵਿੱਚ ਕਾਰਬਨ ਸੰਭਾਲਦਾ ਹੈ। ERW ਵਧਿਆ ਹੋਇਆ ਚਟਾਨ ਘਿਸਾਉ ਹੈ। DAC ਸਿੱਧਾ ਹਵਾ ਕੈਪਚਰ ਹੈ। ਪੱਧਤੀਆਂ ਰਜਿਸਟਰੀ ਢਾਂਚੇ ਵਿੱਚ ਗਤੀਵਿਧੀ ਦਾ ਹਿਸਾਬ ਦਿੰਦੀਆਂ ਹਨ; Bhoomi Carbon ਇਨ੍ਹਾਂ ਦੀ ਸੁਤੰਤਰ ਤਸਦੀਕ ਨਹੀਂ ਕਰਦਾ।" },
  { lang: "mr", section: "प्रकल्प प्रकार आणि पद्धती", text: "REDD+ जंगलतोड व वनक्षयामुळे होणारे उत्सर्जन कमी करण्याशी संबंधित आहे. IFM म्हणजे सुधारित वन व्यवस्थापन. ARR म्हणजे वनीकरण, पुनर्वनीकरण आणि वनस्पती पुनर्स्थापना. Biochar स्थिर जैव-आधारित पदार्थात कार्बन साठवतो. ERW म्हणजे वर्धित खडक अपक्षय. DAC म्हणजे थेट हवेतून कार्बन पकडणे. पद्धती रजिस्ट्री चौकटीत क्रियाकलापाचे लेखांकन ठरवतात; Bhoomi Carbon त्यांची स्वतंत्र पडताळणी करत नाही।" },

  { lang: "en", section: "Fair price explanation", text: "Bhoomi Carbon platform logic explains fair_price = benchmark_price × quality_multiplier. Green/high quality uses 1.0x, Yellow/medium quality uses 0.5x, and Red/low quality uses 0.24x. This formula cannot produce a fair price unless the deterministic benchmark price and inputs are supplied." },
  { lang: "hi", section: "उचित मूल्य की व्याख्या", text: "Bhoomi Carbon प्लेटफ़ॉर्म नियम fair_price = benchmark_price × quality_multiplier समझाता है। Green/उच्च गुणवत्ता के लिए 1.0x, Yellow/मध्यम के लिए 0.5x और Red/निम्न के लिए 0.24x है। जब तक निर्धारक benchmark price और इनपुट उपलब्ध न हों, यह सूत्र उचित मूल्य नहीं देता।" },
  { lang: "pa", section: "ਉਚਿਤ ਕੀਮਤ ਦੀ ਵਿਆਖਿਆ", text: "Bhoomi Carbon ਪਲੇਟਫਾਰਮ ਨਿਯਮ fair_price = benchmark_price × quality_multiplier ਦੱਸਦਾ ਹੈ। Green/ਉੱਚ ਗੁਣਵੱਤਾ ਲਈ 1.0x, Yellow/ਮੱਧਮ ਲਈ 0.5x ਅਤੇ Red/ਘੱਟ ਲਈ 0.24x ਹੈ। ਜਦੋਂ ਤੱਕ ਨਿਰਧਾਰਿਤ benchmark price ਅਤੇ ਇਨਪੁੱਟ ਨਾ ਮਿਲਣ, ਇਹ ਫਾਰਮੂਲਾ ਉਚਿਤ ਕੀਮਤ ਨਹੀਂ ਦੇ ਸਕਦਾ।" },
  { lang: "mr", section: "योग्य किंमतीचे स्पष्टीकरण", text: "Bhoomi Carbon प्लॅटफॉर्म नियम fair_price = benchmark_price × quality_multiplier स्पष्ट करतो. Green/उच्च गुणवत्तेसाठी 1.0x, Yellow/मध्यमसाठी 0.5x आणि Red/कमीसाठी 0.24x आहे. निर्धारक benchmark price आणि इनपुट दिल्याशिवाय हे सूत्र योग्य किंमत देऊ शकत नाही." },

  { lang: "en", section: "Quality scoring explanation", text: "Bhoomi Carbon quality rules are platform rules, not universal scientific laws: +2 for a verified registry; -2 for an unverified or unknown registry; -1 for an outdated legacy renewable-energy methodology; -1 for vintage older than five years; -1 for forestry-type ARR/REDD+ because of permanence-related risk; +1 for DAC/Biochar permanent-storage bonus." },
  { lang: "hi", section: "गुणवत्ता स्कोर की व्याख्या", text: "Bhoomi Carbon के गुणवत्ता नियम प्लेटफ़ॉर्म नियम हैं, सार्वभौमिक वैज्ञानिक नियम नहीं: सत्यापित रजिस्ट्री के लिए +2; असत्यापित या अज्ञात रजिस्ट्री के लिए -2; पुराने विरासत नवीकरणीय-ऊर्जा पद्धति के लिए -1; पाँच वर्ष से पुराने विंटेज के लिए -1; स्थायित्व जोखिम के कारण वन-प्रकार ARR/REDD+ के लिए -1; DAC/Biochar स्थायी-संग्रह बोनस के लिए +1।" },
  { lang: "pa", section: "ਗੁਣਵੱਤਾ ਸਕੋਰ ਦੀ ਵਿਆਖਿਆ", text: "Bhoomi Carbon ਦੇ ਗੁਣਵੱਤਾ ਨਿਯਮ ਪਲੇਟਫਾਰਮ ਨਿਯਮ ਹਨ, ਸਰਵਭੌਮ ਵਿਗਿਆਨਕ ਕਾਨੂੰਨ ਨਹੀਂ: ਤਸਦੀਕਸ਼ੁਦਾ ਰਜਿਸਟਰੀ ਲਈ +2; ਅਣਤਸਦੀਕ ਜਾਂ ਅਣਜਾਣ ਰਜਿਸਟਰੀ ਲਈ -2; ਪੁਰਾਣੀ ਨਵੀਕਰਨਯੋਗ-ਊਰਜਾ ਪੱਧਤੀ ਲਈ -1; ਪੰਜ ਸਾਲ ਤੋਂ ਪੁਰਾਣੇ vintage ਲਈ -1; ਸਥਾਇਤਵ ਜੋਖਮ ਕਰਕੇ ਜੰਗਲ-ਕਿਸਮ ARR/REDD+ ਲਈ -1; DAC/Biochar ਸਥਾਈ-ਸਟੋਰੇਜ ਬੋਨਸ ਲਈ +1।" },
  { lang: "mr", section: "गुणवत्ता गुणांकनाचे स्पष्टीकरण", text: "Bhoomi Carbon चे गुणवत्ता नियम प्लॅटफॉर्म नियम आहेत, सार्वत्रिक वैज्ञानिक नियम नाहीत: पडताळलेल्या रजिस्ट्रीसाठी +2; अपडताळलेल्या किंवा अज्ञात रजिस्ट्रीसाठी -2; कालबाह्य जुन्या नूतनीकरणीय-ऊर्जा पद्धतीसाठी -1; पाच वर्षांपेक्षा जुन्या विंटेजसाठी -1; स्थायित्व-संबंधित जोखमीमुळे वनीकरण-प्रकार ARR/REDD+ साठी -1; DAC/Biochar कायम-साठवण बोनससाठी +1।" },

  { lang: "en", section: "Anomaly and greenwashing check", text: "Anomaly or greenwashing checks are separate from the quality score. If the platform supplies an Isolation Forest or other deterministic anomaly result, Bhoomi Carbon can explain that supplied result. An anomaly signal does not prove fraud or greenwashing." },
  { lang: "hi", section: "असामान्यता और ग्रीनवॉशिंग जाँच", text: "असामान्यता या ग्रीनवॉशिंग जाँच गुणवत्ता स्कोर से अलग है। यदि प्लेटफ़ॉर्म Isolation Forest या अन्य निर्धारक असामान्यता परिणाम देता है, तो Bhoomi Carbon उस दिए गए परिणाम को समझा सकता है। असामान्यता संकेत धोखाधड़ी या ग्रीनवॉशिंग सिद्ध नहीं करता।" },
  { lang: "pa", section: "ਅਸਧਾਰਨਤਾ ਅਤੇ ਗ੍ਰੀਨਵਾਸ਼ਿੰਗ ਜਾਂਚ", text: "ਅਸਧਾਰਨਤਾ ਜਾਂ ਗ੍ਰੀਨਵਾਸ਼ਿੰਗ ਜਾਂਚ ਗੁਣਵੱਤਾ ਸਕੋਰ ਤੋਂ ਵੱਖਰੀ ਹੈ। ਜੇ ਪਲੇਟਫਾਰਮ Isolation Forest ਜਾਂ ਹੋਰ ਨਿਰਧਾਰਿਤ ਅਸਧਾਰਨਤਾ ਨਤੀਜਾ ਦੇਵੇ, Bhoomi Carbon ਉਸ ਦੀ ਵਿਆਖਿਆ ਕਰ ਸਕਦਾ ਹੈ। ਅਸਧਾਰਨਤਾ ਸੰਕੇਤ ਧੋਖਾਧੜੀ ਜਾਂ ਗ੍ਰੀਨਵਾਸ਼ਿੰਗ ਸਾਬਤ ਨਹੀਂ ਕਰਦਾ।" },
  { lang: "mr", section: "असामान्यता आणि ग्रीनवॉशिंग तपासणी", text: "असामान्यता किंवा ग्रीनवॉशिंग तपासणी गुणवत्ता गुणांकनापासून वेगळी आहे. प्लॅटफॉर्मने Isolation Forest किंवा इतर निर्धारक असामान्यता निकाल दिल्यास Bhoomi Carbon त्या दिलेल्या निकालाचे स्पष्टीकरण देऊ शकते. असामान्यता संकेत फसवणूक किंवा ग्रीनवॉशिंग सिद्ध करत नाही." },

  { lang: "en", section: "Buyer flow", text: "Deterministic backend logic can compare required credits with credits already held and produce an optimized mix of listings. Bhoomi Carbon RAG does not run or recreate the optimizer; it may explain buyer, company, or optimizer results supplied in the current request." },
  { lang: "hi", section: "खरीदार प्रवाह", text: "निर्धारक बैकएंड तर्क आवश्यक क्रेडिट की तुलना पहले से रखे क्रेडिट से कर सकता है और लिस्टिंग का अनुकूलित मिश्रण बना सकता है। Bhoomi Carbon RAG optimizer को चलाता या पुनःनिर्मित नहीं करता; यह वर्तमान अनुरोध में दिए खरीदार, कंपनी या optimizer परिणामों को समझा सकता है।" },
  { lang: "pa", section: "ਖਰੀਦਦਾਰ ਪ੍ਰਵਾਹ", text: "ਨਿਰਧਾਰਿਤ ਬੈਕਐਂਡ ਤਰਕ ਲੋੜੀਂਦੇ ਕ੍ਰੈਡਿਟਾਂ ਦੀ ਪਹਿਲਾਂ ਰੱਖੇ ਕ੍ਰੈਡਿਟਾਂ ਨਾਲ ਤੁਲਨਾ ਕਰ ਕੇ ਲਿਸਟਿੰਗਾਂ ਦਾ ਅਨੁਕੂਲ ਮਿਸ਼ਰਣ ਬਣਾ ਸਕਦਾ ਹੈ। Bhoomi Carbon RAG optimizer ਨਹੀਂ ਚਲਾਉਂਦਾ ਜਾਂ ਦੁਬਾਰਾ ਨਹੀਂ ਬਣਾਉਂਦਾ; ਇਹ ਮੌਜੂਦਾ ਬੇਨਤੀ ਵਿੱਚ ਦਿੱਤੇ ਖਰੀਦਦਾਰ, ਕੰਪਨੀ ਜਾਂ optimizer ਨਤੀਜਿਆਂ ਦੀ ਵਿਆਖਿਆ ਕਰ ਸਕਦਾ ਹੈ।" },
  { lang: "mr", section: "खरेदीदार प्रवाह", text: "निर्धारक बॅकएंड तर्क आवश्यक क्रेडिट्सची आधी असलेल्या क्रेडिट्सशी तुलना करून लिस्टिंग्जचे अनुकूल मिश्रण तयार करू शकतो. Bhoomi Carbon RAG optimizer चालवत किंवा पुन्हा तयार करत नाही; ते सध्याच्या विनंतीत दिलेले खरेदीदार, कंपनी किंवा optimizer निकाल समजावू शकते." },
];

export const bhoomiKnowledge: BhoomiKnowledgeDocument[] = entries.map((entry, index) => ({
  ...entry,
  source,
  id: `bhoomi-${entry.lang}-${String(index + 1).padStart(2, "0")}`,
}));
