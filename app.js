/**
 * 音声入力SOAPノート - アプリケーションロジック (AI高度化 & 整形外科・内科特化版)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // DOM要素の取得
    // ==========================================================================
    const btnRecordToggle = document.getElementById('btn-record-toggle');
    const iconMicStart = document.getElementById('icon-mic-start');
    const iconMicStop = document.getElementById('icon-mic-stop');
    const recordInstructionMain = document.getElementById('record-instruction-main');
    const recordInstructionSub = document.getElementById('record-instruction-sub');
    const statusBadge = document.getElementById('recognition-status-badge');
    const statusText = document.getElementById('status-text');
    
    const transcriptTextarea = document.getElementById('transcript-textarea');
    const interimPreviewBox = document.getElementById('interim-preview-box');
    const interimPreviewText = document.getElementById('interim-preview-text');
    const copypasteTextarea = document.getElementById('copypaste-textarea');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    const btnClear = document.getElementById('btn-clear');
    const btnConvert = document.getElementById('btn-convert');
    const btnDemo = document.getElementById('btn-demo');
    const btnDemoSim = document.getElementById('btn-demo-sim');
    const btnCopySoap = document.getElementById('btn-copy-soap');
    
    // AI設定パネル関連
    const btnSettingsToggle = document.getElementById('btn-settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const selectMode = document.getElementById('select-mode');
    const settingsGemini = document.getElementById('settings-gemini');
    const settingsOllama = document.getElementById('settings-ollama');
    const inputApiKey = document.getElementById('input-api-key');
    const inputOllamaUrl = document.getElementById('input-ollama-url');
    const inputOllamaModel = document.getElementById('input-ollama-model');

    // 疾患特化タブとラベル
    const tabBtns = document.querySelectorAll('.tab-btn');
    const specialLabel = document.getElementById('special-label');

    // プレビュー要素
    const previewS = document.getElementById('preview-s');
    const previewPmh = document.getElementById('preview-pmh');
    const previewAllegy = document.getElementById('preview-allegy');
    const previewO = document.getElementById('preview-o');
    const previewAp = document.getElementById('preview-ap');

    // ==========================================================================
    // データ定義
    // ==========================================================================
    
    // 疾患特化デモテキストおよびシミュレーションデータ
    const CLINICAL_DATA = {
        orthopedics: {
            label: '整形外科',
            demoText: '右膝関節の痛みを訴えて来院。2週間前から階段の昇り降りで疼痛が増悪している。既往歴は特になし。アレルギーもなし。身体所見では、右膝関節屈曲100度、伸展-5度と可動域制限があり、大腿四頭筋の筋力低下（MMT3）が認められる。膝関節蓋骨上嚢に軽度の腫脹と熱感あり。右変形性膝関節症による可動域制限および支持性低下と判断される。今後は週2回のリハビリを実施し、大腿四頭筋等尺性収縮運動の指導と、自宅でのスクワット指導を継続する。',
            segments: [
                "右膝関節の痛みを訴えて来院されました。",
                "2週間前から階段の昇り降りで疼痛が増悪しているとのことです。",
                "アレルギーや既往歴は特にありません。",
                "右膝関節の可動域は屈曲100度、伸展マイナス5度と制限されています。",
                "大腿四頭筋の筋力低下はMMT3レベルで、軽度の腫脹と熱感もあります。",
                "右変形性膝関節症による関節可動域制限と支持性低下と考えられます。",
                "今後は週2回のリハビリで大腿四頭筋の筋力強化プログラムを実施します。",
                "自宅でのスクワットや等尺性運動の指導を継続します。"
            ]
        },
        internal: {
            label: '内科',
            demoText: '主訴は突然の右下腹部痛。昨夜から心窩部痛があり、徐々に右下腹部に移動してきたとのこと。吐き気はあるが嘔吐はなし。既往歴はなし。アレルギーはなし。バイタルは体温37.8度、血圧126の78mmHg、脈拍84回。腹部診察にて右下腹部（マックバーニー点）に明らかな圧痛および反跳痛を認める。筋性防御（+）。急性虫垂炎の疑いが極めて高いと考えられる。まずは抗生剤の点滴静注を開始し、至急の血液検査および腹部CT検査を実施する。禁食とし、経過次第では外科に対診する。',
            segments: [
                "主訴は突然の右下腹部痛です。",
                "昨夜からの心窩部痛が徐々に右下腹部に移動したとのことです。",
                "既往歴はなく、アレルギーもありません。",
                "体温37.8度、血圧126の78mmHg、脈拍84回です。",
                "マックバーニー点に明らかな圧痛と反跳痛を認め、筋性防御も陽性です。",
                "臨床所見から急性虫垂炎の疑いが強いと考えられます。",
                "ただちに抗生剤の投与と血液検査、腹部CT検査を実施します。",
                "禁食による安静を指示し、結果次第で外科に対診します。"
            ]
        },
        general: {
            label: '一般',
            demoText: '最近体がだるく疲れが取れないと相談あり。夜間も中途覚醒があり眠れない。既往歴として高血圧で内服中。アレルギーはなし。バイタルは血圧145の90mmHg、脈拍68回。両下肢に軽度の浮腫を認めるが、明らかな発赤や熱感はなし。中途覚醒および高血圧コントロール不良による疲労感の低下が考えられる。塩分制限と水分管理について指導を行い、降圧薬の調整を検討する。睡眠環境の改善も指導し、2週間後に再評価を行う。',
            segments: [
                "最近体がだるく疲れが取れないとの相談です。",
                "夜間も途中で目が覚めてしまい、眠れないとのことです。",
                "既往歴として高血圧があり内服治療中、アレルギーはありません。",
                "血圧は145の90mmHgで、両下肢に軽度の浮腫を認めます。",
                "中途覚醒による睡眠障害と、高血圧のコントロール不良が原因と考えられます。",
                "塩分制限および水分の適切な管理について指導を実施します。",
                "かかりつけ医と降圧薬の調整を相談し、睡眠衛生指導を継続します。",
                "2週間後に再度バイタルと浮腫の評価を行います。"
            ]
        }
    };

    // キーワードフォールバック用の定義
    const KEYWORDS = {
        S: ['痛い', 'つらい', 'しびれる', 'だるい', '動かしにくい', '不安', '眠れない', '訴え', '主訴', '相談'],
        O: ['ROM', 'MMT', '度', 'cm', 'kg', 'mmHg', '回', '秒', '歩行', '握力', 'バイタル', '腫脹', '熱感', '発赤', '体温', '血圧', '脈拍', '浮腫', '圧痛', '反跳痛', '防御'],
        A: ['考えられる', '原因', '問題', '改善', '低下', '制限', 'リスク', '評価', '疑い', '判断', '所見'],
        P: ['プログラム', '目標', '実施', '継続', '指導', '週', '回', 'セット', '退院', '自主トレ', '投与', '検査', '処方', '服薬', '安静', '対診'],
        PMH: ['既往', '病歴', '手術歴', '既往歴'],
        Allegy: ['アレルギー', '過敏症', 'allegy', 'allergy']
    };

    // ==========================================================================
    // 状態管理
    // ==========================================================================
    let isRecording = false;
    let isSimulating = false;
    let recognition = null;
    let currentSpecialty = 'orthopedics'; // デフォルト: 整形外科
    let simulationTimeoutId = null;

    // ==========================================================================
    // 初期設定の読み込みと保存 (localStorage)
    // ==========================================================================
    function loadSettings() {
        try {
            const savedMode = localStorage.getItem('soap_mode');
            const savedApiKey = localStorage.getItem('soap_api_key');
            const savedOllamaUrl = localStorage.getItem('soap_ollama_url');
            const savedOllamaModel = localStorage.getItem('soap_ollama_model');
            const savedSpecialty = localStorage.getItem('soap_specialty');

            if (savedMode) selectMode.value = savedMode;
            if (savedApiKey) inputApiKey.value = savedApiKey;
            if (savedOllamaUrl) inputOllamaUrl.value = savedOllamaUrl;
            if (savedOllamaModel) inputOllamaModel.value = savedOllamaModel;
            
            if (savedSpecialty && CLINICAL_DATA[savedSpecialty]) {
                currentSpecialty = savedSpecialty;
                tabBtns.forEach(btn => {
                    if (btn.dataset.special === savedSpecialty) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                updateSpecialtyUI();
            }
        } catch (e) {
            console.warn('localStorage read is blocked:', e);
        }

        updateSettingsUI();
    }

    function saveSettings() {
        try {
            localStorage.setItem('soap_mode', selectMode.value);
            localStorage.setItem('soap_api_key', inputApiKey.value.trim());
            localStorage.setItem('soap_ollama_url', inputOllamaUrl.value.trim());
            localStorage.setItem('soap_ollama_model', inputOllamaModel.value.trim());
        } catch (e) {
            console.warn('localStorage write is blocked:', e);
        }
    }

    function updateSettingsUI() {
        const mode = selectMode.value;
        if (mode === 'gemini') {
            settingsGemini.classList.remove('hidden');
            settingsOllama.classList.add('hidden');
        } else if (mode === 'ollama') {
            settingsGemini.classList.add('hidden');
            settingsOllama.classList.remove('hidden');
        } else {
            settingsGemini.classList.add('hidden');
            settingsOllama.classList.add('hidden');
        }
    }

    function updateSpecialtyUI() {
        const data = CLINICAL_DATA[currentSpecialty];
        specialLabel.textContent = data.label;
        try {
            localStorage.setItem('soap_specialty', currentSpecialty);
        } catch (e) {
            console.warn('localStorage write is blocked:', e);
        }
    }

    // ==========================================================================
    // Toast通知・ユーティリティ
    // ==========================================================================
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ==========================================================================
    // Web Speech APIの制御
    // ==========================================================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ja-JP';

        recognition.onstart = () => {
            isRecording = true;
            updateRecordingUI(true);
            updateStatus('recording', '録音中...');
            showToast('音声認識を開始しました。');
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                let processedText = finalTranscript.trim();
                if (processedText && !/[。！？]$/.test(processedText)) {
                    processedText += '。';
                }
                
                if (transcriptTextarea.value && !transcriptTextarea.value.endsWith('\n') && !transcriptTextarea.value.endsWith(' ')) {
                    const lastChar = transcriptTextarea.value.slice(-1);
                    if (/[。！？]/.test(lastChar)) {
                        transcriptTextarea.value += '\n' + processedText;
                    } else {
                        transcriptTextarea.value += processedText;
                    }
                } else {
                    transcriptTextarea.value += processedText;
                }
                transcriptTextarea.scrollTop = transcriptTextarea.scrollHeight;
            }

            if (interimTranscript) {
                interimPreviewBox.classList.add('active');
                interimPreviewText.textContent = interimTranscript;
            } else {
                interimPreviewBox.classList.remove('active');
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            isRecording = false;
            updateRecordingUI(false);
            updateStatus('ready', 'エラー');
            if (event.error === 'not-allowed') {
                alert('マイクの使用が許可されていません。ブラウザの設定をご確認ください。');
            } else {
                showToast(`音声認識エラー: ${event.error}`);
            }
        };

        recognition.onend = () => {
            if (!isSimulating) {
                isRecording = false;
                updateRecordingUI(false);
                updateStatus('ready', '待機中');
                interimPreviewBox.classList.remove('active');
                showToast('音声入力を停止しました。');
                
                if (transcriptTextarea.value.trim()) {
                    convertSOAP();
                }
            }
        };
    } else {
        recordInstructionSub.textContent = '※お使いのブラウザは音声認識に対応していません。シミュレーション機能をお使いください。';
        recordInstructionSub.style.color = 'var(--color-danger)';
    }

    function updateRecordingUI(recording) {
        if (recording) {
            btnRecordToggle.classList.add('recording');
            iconMicStart.classList.add('hidden');
            iconMicStop.classList.remove('hidden');
            recordInstructionMain.textContent = '「録音停止」ボタンを押すと完了します';
            document.querySelector('.recording-console').classList.add('active');
        } else {
            btnRecordToggle.classList.remove('recording');
            iconMicStart.classList.remove('hidden');
            iconMicStop.classList.add('hidden');
            recordInstructionMain.textContent = '「録音開始」ボタンを押して話してください';
            document.querySelector('.recording-console').classList.remove('active');
        }
    }

    function updateStatus(type, text) {
        statusBadge.className = 'status-badge';
        statusBadge.classList.add(type);
        statusText.textContent = text;
    }

    function toggleRecording() {
        if (isSimulating) {
            stopSimulation();
            return;
        }
        if (!recognition) {
            alert('音声認識APIがお使いのブラウザで非対応です。');
            return;
        }
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    // ==========================================================================
    // AI SOAP 分類・生成ロジック
    // ==========================================================================
    
    // メインのエントリポイント
    async function convertSOAP() {
        const text = transcriptTextarea.value.trim();
        if (!text) {
            showToast('テキストが入力されていません。');
            return;
        }

        loadingOverlay.classList.remove('hidden');
        updateStatus('recording', 'AI変換中...');

        const mode = selectMode.value;
        let soapData = null;

        try {
            if (mode === 'gemini') {
                soapData = await callGeminiAPI(text);
            } else if (mode === 'ollama') {
                soapData = await callOllamaAPI(text);
            } else {
                // キーワードフォールバック
                soapData = runKeywordFallback(text);
            }
        } catch (error) {
            console.error('AI conversion error, falling back to keyword method:', error);
            showToast('AI接続エラーが発生したため、キーワード分類を実行します。');
            soapData = runKeywordFallback(text);
        } finally {
            loadingOverlay.classList.add('hidden');
            updateStatus('success', '完了');
        }

        if (soapData) {
            displaySOAP(soapData);
        }
    }

    // 1. Gemini API 呼び出し
    async function callGeminiAPI(text) {
        const apiKey = inputApiKey.value.trim();
        if (!apiKey) {
            throw new Error('Gemini API Key is empty.');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const systemPrompt = `あなたは優秀な医療機関の医療事務、理学療法士、または看護師の電子カルテ作成支援AIです。
対象疾患カテゴリー: 【${CLINICAL_DATA[currentSpecialty].label}】

与えられた患者の発話書き起こし、または医療従事者の音声メモから情報を抽出し、臨床的に標準的なカルテ用語（簡潔な日本語・英語混在）に整形・要約し、指定されたJSONスキーマに従って出力してください。
以下のルールを必ず守ってください：
- S（主観的情報）: 患者の主訴、自覚症状を簡潔にまとめてください。
- PMH（既往歴）: 既往歴、病歴があれば抽出してください。明確な言及がない場合は「なし」としてください。
- Allegy（アレルギー）: アレルギー情報があれば抽出してください。明確な言及がない場合は「なし」としてください。
- O（客観的情報）: 身体診察所見、バイタルサイン、検査結果、関節可動域（ROM）、筋力（MMT）、画像所見などを簡潔にまとめてください。
- AP（アセスメント/プラン）: 評価（疑われる診断名・病態）と、それに対応する治療・処置・リハビリ・検査・指導・今後の計画のペアのリストを作成してください。診断名は必ず「＃病名疑い」や「＃症状」などのように「＃」から始めてください。

整形外科の場合は、疼痛部位、誘発テスト、ROM、MMT、歩行、画像所見を重視してください。
内科の場合は、主要症状、バイタル、腹部などの身体所見、検査結果、アレルギー、処薬・処置計画を重視してください。`;

        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `テキスト:\n${text}` }
                    ]
                }
            ],
            systemInstruction: {
                parts: [
                    { text: systemPrompt }
                ]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        S: { type: "STRING", description: "主観的情報。自覚症状や主訴を箇条書きまたは短い文章で" },
                        PMH: { type: "STRING", description: "既往歴（Past Medical History）。なければ'なし'" },
                        Allegy: { type: "STRING", description: "アレルギー。なければ'なし'" },
                        O: { type: "STRING", description: "客観的情報。バイタル、身体所見、測定値など" },
                        AP: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    diagnosis: { type: "STRING", description: "アセスメント・疑い病名。'＃'から始めること。例：'＃変形性膝関節症疑い', '＃急性虫垂炎疑い'" },
                                    plans: { type: "ARRAY", items: { type: "STRING" }, description: "計画。その病態に対する治療、処方、検査、指導など" }
                                },
                                required: ["diagnosis", "plans"]
                            }
                        }
                    },
                    required: ["S", "PMH", "Allegy", "O", "AP"]
                }
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'Gemini API call failed');
        }

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        return JSON.parse(jsonText);
    }

    // 2. Ollama ローカル API 呼び出し
    async function callOllamaAPI(text) {
        const ollamaUrl = inputOllamaUrl.value.trim() || 'http://localhost:11434';
        const ollamaModel = inputOllamaModel.value.trim() || 'gemma2';

        const systemPrompt = `You are a medical scribe assistant.
Analyze the clinical text and extract SOAP format.
Target Specialty: ${CLINICAL_DATA[currentSpecialty].label}

You must return a JSON object containing EXACTLY these keys: "S", "PMH", "Allegy", "O", "AP".
- "S": string, patient subjective complaints.
- "PMH": string, past medical history. Default to "なし" if not mentioned.
- "Allegy": string, allergy information. Default to "なし" if not mentioned.
- "O": string, objective medical metrics, vitals, exam findings.
- "AP": array of objects. Each object has:
  - "diagnosis": string, starting with "＃" (e.g. "＃変形性膝関節症疑い")
  - "plans": array of strings, plans for that diagnosis.

Response must be pure JSON ONLY. No markdown wrapping. Output in Japanese.`;

        const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: ollamaModel,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Text:\n${text}` }
                ],
                stream: false,
                format: "json"
            })
        });

        if (!response.ok) {
            throw new Error('Ollama connection failed');
        }

        const data = await response.json();
        const jsonText = data.message.content;
        return JSON.parse(jsonText);
    }

    // 3. キーワードベースのローカルフォールバック処理
    function runKeywordFallback(text) {
        // 文分割
        const sentences = text
            .split(/([。！？\n])/)
            .reduce((acc, current, index, array) => {
                if (index % 2 === 0) {
                    if (current.trim()) {
                        const punctuation = array[index + 1] || '';
                        acc.push(current.trim() + (punctuation === '\n' ? '。' : punctuation));
                    }
                }
                return acc;
            }, []);

        let sArray = [];
        let oArray = [];
        let aArray = [];
        let pArray = [];
        let pmhArray = [];
        let allegyArray = [];

        sentences.forEach(sentence => {
            let matched = false;

            // アレルギー判定
            if (KEYWORDS.Allegy.some(k => sentence.includes(k))) {
                allegyArray.push(sentence);
                matched = true;
            }
            // 既往歴判定
            else if (KEYWORDS.PMH.some(k => sentence.includes(k))) {
                pmhArray.push(sentence);
                matched = true;
            }
            // 客観判定 (O)
            else if (KEYWORDS.O.some(k => sentence.includes(k))) {
                oArray.push(sentence);
                matched = true;
            }
            // 計画判定 (P)
            else if (KEYWORDS.P.some(k => sentence.includes(k))) {
                pArray.push(sentence);
                matched = true;
            }
            // アセスメント判定 (A)
            else if (KEYWORDS.A.some(k => sentence.includes(k))) {
                aArray.push(sentence);
                matched = true;
            }
            // 主観判定 (S)
            else if (KEYWORDS.S.some(k => sentence.includes(k))) {
                sArray.push(sentence);
                matched = true;
            }
        });

        // 該当しないものはSとして扱う（初期値）
        sentences.forEach(sentence => {
            if (!sArray.includes(sentence) && !oArray.includes(sentence) && 
                !aArray.includes(sentence) && !pArray.includes(sentence) &&
                !pmhArray.includes(sentence) && !allegyArray.includes(sentence)) {
                sArray.push(sentence);
            }
        });

        // アセスメントとプランのペアを作る (A/Pのフォーマット)
        // 疑われる病名がキーワードから分からない場合は、疾患カテゴリに合わせたプレースホルダーを作成
        let diagnosisTitle = '＃病態・動作分析の評価';
        if (currentSpecialty === 'orthopedics') {
            diagnosisTitle = '＃運動器機能障害の疑い';
            // 文脈から「関節症」などがあれば抽出
            const kneeMatch = text.includes('膝');
            if (kneeMatch) diagnosisTitle = '＃変形性膝関節症疑い';
        } else if (currentSpecialty === 'internal') {
            diagnosisTitle = '＃急性腹症・内科疾患疑い';
            const appendMatch = text.includes('虫垂');
            if (appendMatch) diagnosisTitle = '＃虫垂炎疑い';
        }

        // Aの文章もアセスメントの補足文として追加
        const plans = [...aArray, ...pArray];
        if (plans.length === 0) {
            plans.push('指導および介入の継続');
        }

        return {
            S: sArray.join(' ') || '特になし',
            PMH: pmhArray.join(' ') || 'なし',
            Allegy: allegyArray.join(' ') || 'なし',
            O: oArray.join(' ') || '特記事項なし',
            AP: [
                {
                    diagnosis: diagnosisTitle,
                    plans: plans
                }
            ]
        };
    }

    // ==========================================================================
    // 結果表示とコピペエリアへの流し込み
    // ==========================================================================
    function displaySOAP(data) {
        // 1. プレビューカードの更新
        previewS.textContent = data.S || 'なし';
        previewPmh.textContent = data.PMH || 'なし';
        previewAllegy.textContent = data.Allegy || 'なし';
        previewO.textContent = data.O || 'なし';

        // A/P プレビューの構築
        previewAp.innerHTML = '';
        if (data.AP && Array.isArray(data.AP)) {
            data.AP.forEach(pair => {
                const block = document.createElement('div');
                block.className = 'preview-ap-block';
                block.style.marginBottom = '0.75rem';
                
                const diag = document.createElement('strong');
                diag.textContent = pair.diagnosis;
                diag.style.color = 'var(--color-ap-accent)';
                diag.style.display = 'block';
                block.appendChild(diag);

                pair.plans.forEach(plan => {
                    const planText = document.createElement('div');
                    planText.textContent = plan;
                    planText.style.paddingLeft = '0.75rem';
                    planText.style.fontSize = '0.8rem';
                    block.appendChild(planText);
                });
                
                previewAp.appendChild(block);
            });
        } else {
            previewAp.textContent = 'なし';
        }

        // 2. コピペ用テキストエリアの構築 (ご指定のコピペフォーマット)
        let formattedText = `S）${data.S}\n`;
        formattedText += `PMH：${data.PMH}\n`;
        formattedText += `Allegy：${data.Allegy}\n`;
        formattedText += `O)${data.O}\n`;
        formattedText += `A/P)\n`;
        
        if (data.AP && Array.isArray(data.AP)) {
            data.AP.forEach(pair => {
                // ＃が重複しないようにトリム
                const diagTitle = pair.diagnosis.startsWith('＃') || pair.diagnosis.startsWith('#')
                    ? pair.diagnosis 
                    : `＃${pair.diagnosis}`;
                
                formattedText += `${diagTitle}\n`;
                pair.plans.forEach(plan => {
                    formattedText += `${plan}\n`;
                });
            });
        }
        
        // 末尾の余分な改行をトリム
        copypasteTextarea.value = formattedText.trim();
        
        // ハイライトの処理 (プレビューカードにキーワードがあれば <mark> タグを付与)
        highlightKeywords(previewS, KEYWORDS.S);
        highlightKeywords(previewPmh, KEYWORDS.PMH);
        highlightKeywords(previewAllegy, KEYWORDS.Allegy);
        highlightKeywords(previewO, KEYWORDS.O);
    }

    // プレビューテキスト内のキーワードをハイライトする
    function highlightKeywords(element, keywordList) {
        let text = element.textContent;
        if (!text || text === 'なし' || text === '特になし') return;

        keywordList.forEach(keyword => {
            const regex = new RegExp(keyword, 'g');
            text = text.replace(regex, `<mark>${keyword}</mark>`);
        });
        element.innerHTML = text;
    }

    // コピペ用テキストのコピー機能
    function copySoapToClipboard() {
        const text = copypasteTextarea.value.trim();
        if (!text) {
            showToast('コピーするテキストがありません。');
            return;
        }

        navigator.clipboard.writeText(text)
            .then(() => {
                showToast('SOAPカルテをクリップボードにコピーしました！');
            })
            .catch(err => {
                console.error('Copy failed', err);
                showToast('コピーに失敗しました。');
            });
    }

    // ==========================================================================
    // デモ・シミュレーション機能
    // ==========================================================================
    function insertDemoText() {
        if (isSimulating) stopSimulation();
        const data = CLINICAL_DATA[currentSpecialty];
        transcriptTextarea.value = data.demoText;
        showToast(`${data.label}のデモ文章を挿入しました。`);
        convertSOAP();
    }

    function startSimulation() {
        if (isRecording) {
            recognition.stop();
        }
        
        isSimulating = true;
        transcriptTextarea.value = '';
        updateRecordingUI(true);
        updateStatus('recording', '音声認識シミュレート中...');
        recordInstructionMain.textContent = '音声入力をシミュレートしています...';
        recordInstructionSub.textContent = '※デモ用の発話テキストを1文ずつ自動入力中。';
        
        interimPreviewBox.classList.add('active');
        
        const data = CLINICAL_DATA[currentSpecialty];
        let segmentIndex = 0;
        let charIndex = 0;
        let currentSegmentText = '';
        
        function typeCharacter() {
            if (!isSimulating) return;

            const segment = data.segments[segmentIndex];
            
            if (charIndex < segment.length) {
                currentSegmentText += segment[charIndex];
                interimPreviewText.textContent = currentSegmentText;
                charIndex++;
                const delay = 30 + Math.random() * 60; // シミュレーション速度
                simulationTimeoutId = setTimeout(typeCharacter, delay);
            } else {
                if (transcriptTextarea.value) {
                    transcriptTextarea.value += '\n' + segment;
                } else {
                    transcriptTextarea.value = segment;
                }
                transcriptTextarea.scrollTop = transcriptTextarea.scrollHeight;
                
                segmentIndex++;
                if (segmentIndex < data.segments.length) {
                    charIndex = 0;
                    currentSegmentText = '';
                    simulationTimeoutId = setTimeout(typeCharacter, 600);
                } else {
                    finishSimulation();
                }
            }
        }

        simulationTimeoutId = setTimeout(typeCharacter, 400);
    }

    function stopSimulation() {
        if (simulationTimeoutId) {
            clearTimeout(simulationTimeoutId);
            simulationTimeoutId = null;
        }
        isSimulating = false;
        updateRecordingUI(false);
        updateStatus('ready', '待機中');
        interimPreviewBox.classList.remove('active');
        showToast('シミュレーションを停止しました。');
    }

    function finishSimulation() {
        isSimulating = false;
        updateRecordingUI(false);
        updateStatus('success', '完了');
        interimPreviewBox.classList.remove('active');
        showToast('シミュレーション入力が完了しました。');
        convertSOAP();
    }

    // ==========================================================================
    // イベントリスナーの登録
    // ==========================================================================
    btnRecordToggle.addEventListener('click', toggleRecording);
    
    btnClear.addEventListener('click', () => {
        if (isSimulating) stopSimulation();
        if (isRecording) recognition.stop();
        
        transcriptTextarea.value = '';
        copypasteTextarea.value = '';
        previewS.textContent = 'なし';
        previewPmh.textContent = 'なし';
        previewAllegy.textContent = 'なし';
        previewO.textContent = 'なし';
        previewAp.innerHTML = '<p class="empty-state">変換を実行してください</p>';
        updateStatus('ready', '待機中');
        showToast('テキストをクリアしました。');
    });

    btnConvert.addEventListener('click', () => {
        if (isSimulating) stopSimulation();
        convertSOAP();
    });

    btnDemo.addEventListener('click', insertDemoText);
    btnDemoSim.addEventListener('click', startSimulation);
    btnCopySoap.addEventListener('click', copySoapToClipboard);

    // 設定パネルトグル
    btnSettingsToggle.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
    });

    // モード切り替え
    selectMode.addEventListener('change', () => {
        updateSettingsUI();
        saveSettings();
    });

    // 各種設定入力時の自動保存
    inputApiKey.addEventListener('input', saveSettings);
    inputOllamaUrl.addEventListener('input', saveSettings);
    inputOllamaModel.addEventListener('input', saveSettings);

    // 疾患特化タブ切り替え
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSpecialty = btn.dataset.special;
            updateSpecialtyUI();
            showToast(`${CLINICAL_DATA[currentSpecialty].label}モードに切り替えました。`);
        });
    });

    // 起動時の初期化
    loadSettings();
});
