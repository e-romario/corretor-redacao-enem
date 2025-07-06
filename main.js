import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, onSnapshot, serverTimestamp } from 'firebase/firestore';

// Define the Firebase configuration from the global variable
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
// Define the app ID from the global variable
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Componente para a tela inicial de correção de redações
const HomeScreen = ({
    essayText, setEssayText, correctionResult, setCorrectionResult,
    isLoading, setIsLoading, error, setError, handleCorrectEssay,
    userId, renderCorrectionResult
}) => {
    return (
        <>
            <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-6">Corretor de Redações ENEM</h1>
            <p className="text-center text-gray-600 mb-8">
                Cole ou digite sua redação abaixo para receber um feedback detalhado baseado nas 5 competências do ENEM.
            </p>

            {userId && (
                <p className="text-sm text-gray-500 text-center mb-4">
                    Seu ID de Usuário: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{userId}</span>
                </p>
            )}

            <textarea
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out resize-y min-h-[200px] text-gray-800"
                placeholder="Cole ou digite sua redação aqui..."
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                rows="10"
            ></textarea>

            <button
                onClick={handleCorrectEssay}
                disabled={isLoading}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <div className="loading-spinner"></div>
                        <span>Corrigindo...</span>
                    </>
                ) : (
                    'Corrigir Redação'
                )}
            </button>

            {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-fade-in">
                    <p className="font-semibold">Erro:</p>
                    <p>{error}</p>
                </div>
            )}

            {renderCorrectionResult()}
        </>
    );
};

// Componente para a tela de perfil e histórico
const ProfileScreen = ({ userId, correctionsHistory }) => {
    // Process history to get average score per theme
    const getThemeScores = () => {
        const themeData = {};
        correctionsHistory.forEach(item => {
            const theme = item.correction.theme || "Tema Não Identificado"; // Use identified theme or default
            const score = item.correction.notaFinal;
            if (!themeData[theme]) {
                themeData[theme] = { totalScore: 0, count: 0 };
            }
            themeData[theme].totalScore += score;
            themeData[theme].count += 1;
        });

        return Object.keys(themeData).map(theme => ({
            theme: theme,
            averageScore: themeData[theme].totalScore / themeData[theme].count
        }));
    };

    const themeScores = getThemeScores();

    return (
        <>
            <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-6">Meu Perfil e Progresso</h1>
            <p className="text-center text-gray-600 mb-8">
                Acompanhe seu desempenho e histórico de redações.
            </p>

            {userId && (
                <p className="text-sm text-gray-500 text-center mb-4">
                    Seu ID de Usuário: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{userId}</span>
                </p>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Progresso por Tema</h2>
                {themeScores.length > 0 ? (
                    <div className="space-y-4">
                        {themeScores.map((data, index) => (
                            <div key={index} className="flex items-center space-x-4">
                                <span className="font-semibold text-gray-700 w-1/3">{data.theme}:</span>
                                <div className="flex-grow bg-gray-200 rounded-full h-4">
                                    <div
                                        className="bg-green-500 h-4 rounded-full"
                                        style={{ width: `${(data.averageScore / 1000) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-gray-800 font-bold">{data.averageScore.toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">Corrija algumas redações para ver seu progresso por tema aqui!</p>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Histórico de Correções</h2>
                {correctionsHistory.length > 0 ? (
                    <div className="space-y-4">
                        {correctionsHistory.map((item) => (
                            <div key={item.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out">
                                <p className="text-sm text-gray-500 mb-1">
                                    Data: {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Carregando...'}
                                </p>
                                <p className="text-lg font-semibold text-gray-700">
                                    Tema: <span className="text-purple-600">{item.correction.theme || "Não Identificado"}</span>
                                </p>
                                <p className="text-lg font-semibold text-gray-700">Nota Final: <span className="text-blue-600">{item.correction.notaFinal}</span> / 1000</p>
                                <p className="text-gray-600 line-clamp-2">Redação: {item.essayText}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">Nenhuma correção anterior encontrada. Comece corrigindo sua primeira redação!</p>
                )}
            </div>
        </>
    );
};


// Main App Component
const App = () => {
    // State variables for Essay Correction
    const [essayText, setEssayText] = useState('');
    const [correctionResult, setCorrectionResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // State variables for User and Firestore History
    const [userId, setUserId] = useState(null);
    const [correctionsHistory, setCorrectionsHistory] = useState([]);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // State for screen navigation
    const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'profile'

    // Effect for Firebase authentication and user ID setup
    useEffect(() => {
        const setupAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined') {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (authError) {
                console.error("Erro na autenticação Firebase:", authError);
                setError("Erro ao autenticar. Tente novamente.");
            }
        };

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // If no user, generate a random ID for anonymous use
                setUserId(crypto.randomUUID());
            }
            setIsAuthReady(true); // Auth is ready after initial check
        });

        setupAuth(); // Call setup auth
        return () => unsubscribe(); // Cleanup auth listener
    }, []); // Run only once on component mount

    // Effect for fetching corrections history from Firestore
    useEffect(() => {
        if (!isAuthReady || !userId) return; // Wait for auth to be ready and userId to be set

        const correctionsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/corrections`);
        const q = query(correctionsCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort history in memory by timestamp in descending order (most recent first)
            const sortedHistory = history.sort((a, b) => {
                const timestampA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
                const timestampB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
                return timestampB - timestampA;
            });
            setCorrectionsHistory(sortedHistory);
        }, (firestoreError) => {
            console.error("Erro ao buscar histórico de correções:", firestoreError);
            setError("Erro ao carregar histórico de correções.");
        });

        return () => unsubscribe(); // Cleanup listener
    }, [isAuthReady, userId]); // Re-run when auth state or userId changes

    // Function to call Gemini API for essay correction
    const handleCorrectEssay = async () => {
        if (!essayText.trim()) {
            setError("Por favor, insira o texto da redação.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setCorrectionResult(null);

        try {
            const prompt = `Você é um avaliador de redações do ENEM altamente experiente e rigoroso. Analise a redação a seguir com base nas cinco competências do ENEM (Domínio da escrita formal da língua portuguesa; Compreensão da proposta e desenvolvimento do tema; Seleção, relação, organização e interpretação de informações, fatos, opiniões e argumentos; Conhecimentos dos mecanismos linguísticos necessários para a construção da argumentação; Elaboração de proposta de intervenção para o problema abordado, respeitando os direitos humanos). Forneça uma nota final de 0 a 1000 e, para cada competência, uma nota de 0 a 200 e um feedback detalhado sobre os pontos fortes e as áreas de melhoria. Ao final, inclua sugestões gerais para aprimoramento da redação. Além disso, identifique o tema principal da redação em uma frase curta. A resposta deve ser um JSON com a seguinte estrutura: { "notaFinal": number, "competencias": [{ "competencia": string, "nota": number, "feedback": string }], "sugestoesGerais": string, "theme": string }. A redação é: ${essayText}`;

            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "notaFinal": { "type": "NUMBER" },
                            "competencias": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "competencia": { "type": "STRING" },
                                        "nota": { "type": "NUMBER" },
                                        "feedback": { "type": "STRING" }
                                    }
                                }
                            },
                            "sugestoesGerais": { "type": "STRING" },
                            "theme": { "type": "STRING" } // Added theme to schema
                        },
                        "propertyOrdering": ["notaFinal", "competencias", "sugestoesGerais", "theme"]
                    }
                }
            };

            const apiKey = ""; // API key is provided by Canvas runtime
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro da API: ${errorData.error.message || response.statusText}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonString = result.candidates[0].content.parts[0].text;
                const parsedResult = JSON.parse(jsonString);
                setCorrectionResult(parsedResult);
                saveCorrectionToFirestore(parsedResult); // Save the result to Firestore
            } else {
                throw new Error("Resposta da IA inesperada ou vazia.");
            }

        } catch (err) {
            console.error("Erro ao corrigir redação:", err);
            setError(`Erro ao corrigir redação: ${err.message}. Por favor, tente novamente.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to save correction result to Firestore
    const saveCorrectionToFirestore = async (result) => {
        if (!userId) {
            console.warn("ID do usuário não disponível para salvar correção.");
            return;
        }
        try {
            const docRef = doc(db, `artifacts/${appId}/users/${userId}/corrections`, Date.now().toString()); // Use timestamp as doc ID
            await setDoc(docRef, {
                essayText: essayText,
                correction: result,
                timestamp: serverTimestamp(), // Use server timestamp
                userId: userId // Store userId for clarity
            });
            console.log("Correção salva no Firestore com sucesso!");
        } catch (firestoreError) {
            console.error("Erro ao salvar correção no Firestore:", firestoreError);
            setError("Erro ao salvar a correção. Tente novamente.");
        }
    };

    // Render function for correction result
    const renderCorrectionResult = () => {
        if (!correctionResult) return null;

        return (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Resultado da Correção</h2>
                <div className="mb-4">
                    <p className="text-lg font-semibold text-gray-700">Nota Final: <span className="text-blue-600 text-3xl font-extrabold">{correctionResult.notaFinal}</span> / 1000</p>
                    {correctionResult.theme && (
                        <p className="text-md text-gray-600">Tema Identificado: <span className="font-semibold text-purple-600">{correctionResult.theme}</span></p>
                    )}
                </div>

                <div className="space-y-4">
                    {correctionResult.competencias.map((comp, index) => (
                        <div key={index} className="border-b border-gray-200 pb-4">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                {comp.competencia} <span className="text-blue-500">({comp.nota} / 200)</span>
                            </h3>
                            <p className="text-gray-700 leading-relaxed">{comp.feedback}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">Sugestões Gerais de Melhoria</h3>
                    <p className="text-blue-700 leading-relaxed">{correctionResult.sugestoesGerais}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8 font-inter">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .loading-spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-left-color: #3b82f6; /* Tailwind blue-500 */
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
                {/* Navigation Buttons */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setCurrentPage('home')}
                        className={`py-2 px-6 rounded-full font-semibold transition duration-300 ${
                            currentPage === 'home' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Correção
                    </button>
                    <button
                        onClick={() => setCurrentPage('profile')}
                        className={`py-2 px-6 rounded-full font-semibold transition duration-300 ${
                            currentPage === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Meu Progresso
                    </button>
                </div>

                {currentPage === 'home' && (
                    <HomeScreen
                        essayText={essayText}
                        setEssayText={setEssayText}
                        correctionResult={correctionResult}
                        setCorrectionResult={setCorrectionResult}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        error={error}
                        setError={setError}
                        handleCorrectEssay={handleCorrectEssay}
                        userId={userId}
                        renderCorrectionResult={renderCorrectionResult}
                    />
                )}

                {currentPage === 'profile' && (
                    <ProfileScreen
                        userId={userId}
                        correctionsHistory={correctionsHistory}
                    />
                )}
            </div>
        </div>
    );
};

export default App;

