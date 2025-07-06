
import streamlit as st
import os
import google.generativeai as genai
from mimetypes import guess_type
from dotenv import load_dotenv
import pandas as pd
import re
import altair as alt
import tempfile

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

# --- Configuração do Agente ---
API_KEY = os.getenv('GEMINI_API_KEY')
MODEL_NAME = "gemini-1.5-flash"

# Configura a API do Google
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    st.error("Erro: Chave de API da Gemini não encontrada.")

# --- Funções do Agente Corretor ---

def get_info_enem():
    """
    Retorna um dicionário com os critérios, pontuação e instruções para o ENEM.
    """
    return {
        'criterios': """
- **Competência 1**: Domínio da modalidade escrita formal da língua portuguesa.
- **Competência 2**: Compreensão da proposta de redação e aplicação de conceitos para desenvolver o tema.
- **Competência 3**: Seleção, organização e interpretação de informações, fatos e argumentos.
- **Competência 4**: Conhecimento dos mecanismos linguísticos para a argumentação.
- **Competência 5**: Elaboração de proposta de intervenção para o problema, respeitando os direitos humanos.
""",
        'pontuacao': "A pontuação total da redação do ENEM é de 0 a 1000 pontos.",
        'instrucao_pontuacao': "Forneça uma pontuação para cada competência (0 a 200) e uma pontuação total."
    }

def executar_correcao_enem(file_path: str, tema: str) -> str:
    """
    Função principal do Agente Corretor.
    Recebe o caminho do arquivo da redação e o tema, e retorna a correção bruta.
    """
    if not API_KEY:
        return "Erro: A chave da API não foi configurada."

    try:
        info_enem = get_info_enem()
        corpo_prompt = """
Você é um Agente de IA especialista em correção de redações do ENEM. Sua única função é avaliar uma redação com base nas 5 competências oficiais. Seja rigoroso, técnico e siga o formato de saída à risca.

**Tema da redação:** "{tema}"

**Critérios de Avaliação (ENEM):**
{criterios}

**Pontuação:**
{pontuacao}
{instrucao_pontuacao}

**Formato de Saída Obrigatório:**
Siga estritamente este formato. Não inclua saudações, despedidas, dicas, sugestões ou qualquer texto fora da estrutura definida abaixo.

Nota da Redação: [Pontuação total de 0 a 1000]

Competência 1
Domínio da modalidade escrita formal da língua portuguesa.
**Sua nota nessa competência foi: [nota de 0 a 200]**
[Análise técnica detalhada e objetiva da competência 1, justificando a nota com exemplos do texto, se necessário.]

Competência 2
Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento para desenvolver o tema.
**Sua nota nessa competência foi: [nota de 0 a 200]**
[Análise técnica detalhada e objetiva da competência 2, justificando a nota.]

Competência 3
Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista.
**Sua nota nessa competência foi: [nota de 0 a 200]**
[Análise técnica detalhada e objetiva da competência 3, justificando a nota.]

Competência 4
Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação.
**Sua nota nessa competência foi: [nota de 0 a 200]**
[Análise técnica detalhada e objetiva da competência 4, justificando a nota.]

Competência 5
Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.
**Sua nota nessa competência foi: [nota de 0 a 200]**
[Análise técnica detalhada e objetiva da competência 5, justificando a nota.]
""".format(tema=tema, **info_enem)

        mime_type, _ = guess_type(file_path)
        if not mime_type:
            return f"Erro: Não foi possível determinar o tipo do arquivo: {file_path}"

        with open(file_path, "rb") as f:
            media = {"mime_type": mime_type, "data": f.read()}

        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content([corpo_prompt, media])
        
        return response.text.strip()

    except FileNotFoundError:
        return f"Erro: O arquivo não foi encontrado no caminho: {file_path}"
    except Exception as e:
        return f"Erro inesperado ao executar a correção: {e}"

def extract_score(text):
    """Extrai a pontuação da correção."""
    match = re.search(r"Nota da Redação: (\d+)", text)
    if match:
        return int(match.group(1))
    return None

# --- Funções de Interface ---

def setup_theme():
    """Aplica o tema de cores da aplicação."""
    st.markdown(
        """
        <style>
        .stApp {
            background-color: #FFFFFF;
            color: #000000;
        }
        /* Aba de Nova Correção */
        .stTabs [data-baseweb="tab-list"] button[aria-selected="false"] {
            color: #D0B6B6; /* Darker pink for inactive text on pink tab */
        }
        .stTabs [data-baseweb="tab-list"] button[aria-selected="true"] {
            color: #000000; /* Black for active text */
        }
        .stTabs [data-baseweb="tab-list"] button:nth-child(2)[aria-selected="false"] {
            color: #B6D0D0; /* Darker blue for inactive text on blue tab */
        }
        .stTabs [data-baseweb="tab-list"] button:nth-child(1) {
            background-color: #F2D8D8;
        }
        .stTabs [data-baseweb="tab-list"] button:nth-child(1):hover {
            background-color: #E0C7C7; /* Cor de hover para Nova Correção */
        }
        .stTabs [data-baseweb="tab-list"] button:nth-child(1):active {
            background-color: #D0B6B6; /* Cor de active para Nova Correção */
        }
        .stTabs [data-baseweb="tab-list"] button:nth-child(1)[aria-selected="true"] {
            border-bottom: 4px solid #F2D8D8 !important; /* Pink for active tab 1 */
        }
        /* Aba de Histórico e Progresso */
        .stTabs [data-baseweb="tab-list"] button:nth-child(2) {
            background-color: #D8F2F2;
        }
        .stTabs [data-baseweb="tab-list"] button:nth-child(2):hover {
            background-color: #C7E0E0; /* Cor de hover para Histórico e Progresso */
        }
        .stTabs [data-baseweb="tab-list"] button:nth-child(2):active {
            background-color: #B6D0D0; /* Cor de active para Histórico e Progresso */
        }
        .stTabs [data-baseweb="tab-list"] button:nth-child(2)[aria-selected="true"] {
            border-bottom: 4px solid #D8F2F2 !important; /* Blue for active tab 2 */
        }
        .stButton>button {
            background-color: #E8F2D8;
            color: #000000;
            border-radius: 10px;
        }
        .stButton>button:hover {
            background-color: #D7E0C7; /* Cor de hover para botões */
        }
        .stButton>button:active {
            background-color: #C7D0B6; /* Cor de active para botões */
        }
        </style>
        """,
        unsafe_allow_html=True
    )

def display_history(history):
    """Exibe o histórico de correções."""
    if not history:
        st.info("Nenhuma correção foi realizada ainda.")
        return

    st.subheader("Histórico de Correções")
    for i, item in enumerate(history):
        score_text = f" - Pontuação: {item['score']}" if item['score'] is not None else ""
        with st.expander(f"Correção {i+1} - Tema: {item['tema']}{score_text}"):
            st.write(item['resultado'])

def display_top5_chart(history):
    """Exibe o gráfico de Top 5 redações e o salva como HTML."""
    if not history:
        st.info("Realize pelo menos uma correção para visualizar o gráfico de Top 5.")
        return

    # Filtra e ordena as redações com pontuação
    scored_history = sorted([item for item in history if item['score'] is not None], key=lambda x: x['score'], reverse=True)[:5]

    if not scored_history:
        st.info("Nenhuma pontuação encontrada no histórico para gerar o gráfico.")
        return
        
    df = pd.DataFrame({
        'Redação': [f"Top {i+1}" for i in range(len(scored_history))],
        'Pontuação': [item['score'] for item in scored_history],
        'Tema': [item['tema'] for item in scored_history]
    })

    chart = alt.Chart(df).mark_bar(
        color='#D8F2F2'
    ).encode(
        x=alt.X('Redação', axis=None),
        y=alt.Y('Pontuação', axis=None),
        tooltip=['Tema', 'Pontuação']
    ).properties(
        width=alt.Step(80)
    )

    text = chart.mark_text(
        align='center',
        baseline='middle',
        dy=-20,  # Deslocamento vertical do texto
        fontSize=30,  # Tamanho da fonte
        color='#304b4b'
    ).encode(
        text='Pontuação:Q'
    )

    final_chart = (chart + text).configure_view(
        strokeWidth=0,
        fill='transparent'
    ).configure_axis(
        grid=False
    )
    
    chart_path = "top5_chart.html"
    final_chart.save(chart_path)
    
    st.altair_chart(final_chart, use_container_width=True)
    return scored_history

def main():
    """Função principal da aplicação."""
    setup_theme()
    st.title("Corretor de Redações ENEM")

    if 'history' not in st.session_state:
        st.session_state.history = []

    tab1, tab2 = st.tabs(["Nova Correção", "Histórico e Progresso"])

    with tab1:
        st.header("Enviar Redação para Correção")
        tema = st.text_input("Digite o tema da redação:")
        uploaded_file = st.file_uploader("Selecione o arquivo da redação (PDF, TXT, etc.)", type=['pdf', 'txt', 'docx'])

        if st.button("Corrigir Redação"):
            if uploaded_file is not None and tema:
                with st.spinner("Corrigindo..."):
                    # Cria um arquivo temporário para salvar o upload
                    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.name)[1]) as temp_file:
                        temp_file.write(uploaded_file.getbuffer())
                        temp_file_path = temp_file.name
                    
                    resultado = executar_correcao_enem(temp_file_path, tema)
                    
                    # Remove o arquivo temporário após o uso
                    os.unlink(temp_file_path)
                    score = extract_score(resultado)
                    st.session_state.history.append({'tema': tema, 'resultado': resultado, 'score': score})
                    st.success("Correção finalizada!")
                    st.markdown(resultado)
            else:
                st.warning("Por favor, forneça o tema e o arquivo da redação.")

    with tab2:
        st.header("Seu Desempenho")
        top_5_redacoes = display_top5_chart(st.session_state.history)
        
        if top_5_redacoes:
            st.subheader("Detalhes das Top 5 Redações")
            for i, item in enumerate(top_5_redacoes):
                with st.expander(f"Top {i+1} - Tema: {item['tema']} - Pontuação: {item['score']}"):
                    st.write(item['resultado'])
        
        display_history(st.session_state.history)

if __name__ == '__main__':
    main()

