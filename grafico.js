// Componente para a tela de perfil e histórico
const ProfileScreen = ({ userId, correctionsHistory }) => {
    // useRef para armazenar referências a cada elemento de redação no histórico.
    // Isso permite rolar para uma redação específica ao clicar na barra do gráfico.
    const essayRefs = useRef({});

    // Função para obter as 5 melhores redações com base na nota final.
    // Ela cria uma cópia do array 'correctionsHistory' para não modificar o original,
    // ordena em ordem decrescente pela 'notaFinal' e pega os 5 primeiros elementos.
    const getTop5Essays = () => {
        return [...correctionsHistory]
            .sort((a, b) => b.correction.notaFinal - a.correction.notaFinal)
            .slice(0, 5);
    };

    // Chama a função para obter as top 5 redações
    const top5Essays = getTop5Essays();

    // Função para rolar a página até uma redação específica no histórico.
    // Ela recebe o ID da redação, encontra o elemento DOM correspondente
    // (através da referência armazenada em 'essayRefs.current') e utiliza
    // 'scrollIntoView' para fazer a rolagem suave.
    const scrollToEssay = (essayId) => {
        const element = essayRefs.current[essayId];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <>
            {/* ... (código anterior da tela de perfil, como título e ID do usuário) ... */}

            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Top 5 Redações</h2>
                {top5Essays.length > 0 ? (
                    // Contêiner flexível para as barras do gráfico.
                    // 'justify-around' distribui as barras igualmente, 'items-end' alinha-as na parte inferior.
                    // 'h-48' define uma altura fixa para o gráfico.
                    // Linhas de grade e posicionamento absoluto são para a estética do gráfico.
                    <div className="flex justify-around items-end h-48 border-b border-l border-gray-300 pb-2 px-2 relative">
                        {/* Linhas de grade para referência visual dos 1000 pontos */}
                        <div className="absolute inset-0 flex flex-col justify-between py-2 px-2">
                            <div className="h-px bg-gray-200 w-full" style={{ top: '0%' }}></div> {/* 1000 */}
                            <div className="h-px bg-gray-200 w-full" style={{ top: '25%' }}></div> {/* 750 */}
                            <div className="h-px bg-gray-200 w-full" style={{ top: '50%' }}></div> {/* 500 */}
                            <div className="h-px bg-gray-200 w-full" style={{ top: '75%' }}></div> {/* 250 */}
                            <div className="h-px bg-gray-200 w-full" style={{ bottom: '0%' }}></div> {/* 0 */}
                        </div>
                        {top5Essays.map((data, index) => (
                            // Cada barra do gráfico
                            <div
                                key={data.id} // Usa o ID da redação como chave única
                                className="flex flex-col items-center mx-2 cursor-pointer relative z-10"
                                onClick={() => scrollToEssay(data.id)} // Ao clicar, rola para a redação
                            >
                                {/* Exibe a nota final acima da barra */}
                                <span className="text-sm font-bold text-gray-700 mb-1">{data.correction.notaFinal}</span>
                                {/* A barra em si. Sua altura é calculada proporcionalmente à nota (0-1000). */}
                                <div
                                    className="bg-orange-500 rounded-lg w-12 transition-all duration-300 ease-in-out hover:scale-105 shadow-md"
                                    style={{ height: `${(data.correction.notaFinal / 1000) * 100}%` }}
                                ></div>
                                {/* Exibe o tema da redação abaixo da barra (truncado se muito longo) */}
                                <span className="text-xs text-gray-600 mt-1 truncate w-12 text-center" title={data.correction.theme || "Não Identificado"}>
                                    {data.correction.theme ? data.correction.theme.split(' ')[0] : 'N/A'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">Corrija algumas redações para ver seu progresso aqui!</p>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Histórico de Correções</h2>
                {correctionsHistory.length > 0 ? (
                    <div className="space-y-4">
                        {correctionsHistory.map((item) => (
                            // Cada item do histórico de correções
                            <div
                                key={item.id}
                                id={`essay-${item.id}`} // Adiciona um ID único para cada redação para facilitar a rolagem
                                // Armazena uma referência ao elemento DOM para que 'scrollToEssay' possa acessá-lo.
                                ref={el => essayRefs.current[item.id] = el}
                                className="border border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out"
                            >
                                {/* ... (conteúdo do item do histórico: data, tema, nota, texto da redação) ... */}
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