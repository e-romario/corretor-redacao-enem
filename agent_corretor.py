import streamlit as st
import os
import google.generativeai as genai
from mimetypes import guess_type
import sys
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

# --- Configuração do Agente ---
API_KEY = os.getenv('GEMINI_API_KEY')
MODEL_NAME = "gemini-1.5-flash"

# Configura a API do Google
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    # Em um cenário de agente real, isso poderia logar um erro ou levantar uma exceção
    print("Erro: Chave de API da Gemini não encontrada.")

# --- Funções do Agente Corretor ---

def get_info_enem():
    """
    Retorna um dicionário com os critérios, pontuação e instruções para o ENEM.
    Esta função encapsula o conhecimento especializado do agente.
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
        # 1. Obter o conhecimento especializado do ENEM
        info_enem = get_info_enem()

        # 2. Construir o prompt detalhado para a IA
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

        # 3. Preparar o arquivo para envio
        mime_type, _ = guess_type(file_path)
        if not mime_type:
            return f"Erro: Não foi possível determinar o tipo do arquivo: {file_path}"

        with open(file_path, "rb") as f:
            media = {"mime_type": mime_type, "data": f.read()}

        # 4. Executar o modelo generativo
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content([corpo_prompt, media])
        
        return response.text.strip()

    except FileNotFoundError:
        return f"Erro: O arquivo não foi encontrado no caminho: {file_path}"
    except Exception as e:
        # Em um sistema real, isso seria logado de forma mais detalhada
        return f"Erro inesperado ao executar a correção: {e}"

# --- Exemplo de uso (para teste direto do script) ---
if __name__ == '__main__':
    # Este bloco permite testar o agente diretamente pela linha de comando.
    # Como usar:
    # python agent_corretor.py "caminho/para/sua/redacao.txt" "Tema da Redação"

    if len(sys.argv) < 3:
        print("Erro: Argumentos insuficientes.")
        print("Uso: python agent_corretor.py <caminho_do_arquivo> \"<tema_da_redacao>\"")
        sys.exit(1)

    caminho_teste = sys.argv[1]
    tema_teste = sys.argv[2]

    print("Iniciando teste do Agente Corretor...")
    print(f"Arquivo: {caminho_teste}")
    print(f"Tema: {tema_teste}")
    print("-" * 30)

    if not os.path.exists(caminho_teste):
        print(f"Erro: Arquivo de teste não encontrado em: {caminho_teste}")
        sys.exit(1)

    resultado_correcao = executar_correcao_enem(caminho_teste, tema_teste)
    print("--- Resultado da Correção ---")
    print(resultado_correcao)
    print("-" * 30)
