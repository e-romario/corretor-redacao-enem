import streamlit as st
import os
import re
from agent_corretor import executar_correcao_enem
import tempfile

# --- Funções de Apoio ---

def parse_and_display_correction(correction_text: str):
    """
    Analisa o texto de correção bruto e o exibe de forma estruturada no Streamlit.
    """
    st.header("Resultado da Correção")

    # 1. Extrair a Nota Total
    total_score_match = re.search(r"Nota da Redação:.*?(\d+)", correction_text)
    if total_score_match:
        total_score = total_score_match.group(1)
        st.metric(label="Nota Total da Redação", value=f"{total_score} / 1000")
    else:
        st.warning("Não foi possível extrair a nota total.")

    st.markdown("---")

    # 2. Dividir a correção pelas competências
    # Usamos uma expressão regular para encontrar cada bloco de competência
    competencias = re.split(r"\n(?=Competência \d)", correction_text)
    
    # O primeiro elemento pode ser a nota total ou lixo, então o ignoramos se necessário
    start_index = 1 if "Competência 1" in competencias[1] else 0
    
    for i, comp_block in enumerate(competencias[start_index:], start=1):
        # Extrair o título da competência
        title_match = re.search(r"Competência \d.*", comp_block)
        title = title_match.group(0).strip() if title_match else f"Competência {i}"

        # Extrair a nota da competência
        score_match = re.search(r"Sua nota nessa competência foi:.*?(\d+)", comp_block)
        score = score_match.group(1) if score_match else "N/A"

        # Extrair a análise
        # A análise é o texto após a linha da nota
        analysis_match = re.search(r"\*\*Sua nota nessa competência foi:.*?\*\*\n(.*)", comp_block, re.DOTALL)
        analysis = analysis_match.group(1).strip() if analysis_match else "Análise não encontrada."

        # 3. Exibir em um container
        with st.container(border=True):
            col1, col2 = st.columns([4, 1])
            with col1:
                st.subheader(title)
            with col2:
                st.metric(label="Nota", value=f"{score} / 200")
            
            st.markdown(analysis)


# --- Interface do Streamlit ---

st.set_page_config(page_title="Corretor de Redação ENEM", layout="wide")

st.title("🤖 Agente Corretor de Redação para o ENEM")
st.markdown("""
Envie a sua redação (em formato de texto, PDF ou imagem) e o tema proposto para receber uma análise detalhada
baseada nas 5 competências do ENEM.
""")

# --- Inputs do Usuário ---
st.header("1. Insira o Tema da Redação")
tema_redacao = st.text_input("Tema:", placeholder="Digite o tema completo da redação aqui...")

st.header("2. Envie sua Redação")
uploaded_file = st.file_uploader(
    "Selecione o arquivo da sua redação (txt, pdf, png, jpg)",
    type=['txt', 'pdf', 'png', 'jpg', 'jpeg']
)

# --- Botão de Correção e Lógica Principal ---
st.header("3. Iniciar Correção")
if st.button("Corrigir Minha Redação"):
    if uploaded_file is not None and tema_redacao:
        # Criar um arquivo temporário para salvar o upload
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.name)[1]) as tmp_file:
            tmp_file.write(uploaded_file.getvalue())
            caminho_arquivo_temporario = tmp_file.name

        try:
            with st.spinner("Aguarde, o agente está corrigindo sua redação... Isso pode levar um minuto."):
                # Chamar o agente para executar a correção
                resultado_correcao = executar_correcao_enem(caminho_arquivo_temporario, tema_redacao)

            # --- Exibição do Resultado ---
            parse_and_display_correction(resultado_correcao)

        except Exception as e:
            st.error(f"Ocorreu um erro durante a correção: {e}")
        finally:
            # Remover o arquivo temporário
            os.remove(caminho_arquivo_temporario)

    elif not tema_redacao:
        st.warning("Por favor, insira o tema da redação.")
    else:
        st.warning("Por favor, envie o arquivo da sua redação.")

# --- Rodapé ---
st.markdown("---")
st.write("Desenvolvido com Streamlit e Google Gemini")
