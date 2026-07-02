let paginaAtual = 1;
const itensPorPagina = 20;

document.addEventListener("DOMContentLoaded", () => {
    carregarHistorico();

    document.getElementById('botao-anterior').addEventListener('click', () => alterarPagina(-1));
    document.getElementById('botao-proximo').addEventListener('click', () => alterarPagina(1));
    document.getElementById('botao-filtrar').addEventListener('click', () => {
        paginaAtual = 1;
        carregarHistorico();
    });

    const btnLimpar = document.getElementById('botao-limpar');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            document.getElementById('filtro-busca').value = "";
            document.getElementById('filtro-tipo').value = "todos";

            paginaAtual = 1;

            carregarHistorico();
        });
    }
});

// Função para carregar o histórico das movimentações
async function carregarHistorico() {
    console.log(`Carregando histórico - Página: ${paginaAtual}`);

    const buscaTexto = document.getElementById('filtro-busca').value;
    const tipoSelecionado = document.getElementById('filtro-tipo').value;

    const doItem = (paginaAtual - 1) * itensPorPagina;
    const ateOItem = doItem + itensPorPagina - 1;

    let query = supabase
        .from('movimentacoes')
        .select('mov_created_at, mov_descricao, mov_valor, mov_tipo', {count: 'exact'})
        .order('mov_created_at', {ascending: false})
        .range(doItem, ateOItem);

    if (buscaTexto.trim() !== "") {
        query = query.ilike('mov_descricao', `%${buscaTexto}`);
    }

    if (tipoSelecionado !== "todos") {
        query = query.eq('mov_tipo', parseInt(tipoSelecionado));
    }

    const {data: movimentacoes, count, error} = await query;

    if (error) {
        console.error("Erro ao buscar histórico: ", error.message);
        return;
    }

    renderizarTabela(movimentacoes);
    atualizarBotoesPaginacao(count);
}

// Função para renderizar tabela
function renderizarTabela(dados) {
    const corpoTabela = document.getElementById('corpo-tabela');
    if (!corpoTabela) return;

    corpoTabela.innerHTML = "";

    if (!dados || dados.length === 0) {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-secondary);">Nenhuma movimentação encontrada com os filtros aplicados.</td>
            </tr>
        `;
        return;
    }

    dados.forEach(mov => {
        const tr = document.createElement('tr');

        let tipo = Number(mov.mov_tipo);
        let classeCor = '';
        let badgeClasse = '';
        let tipoTexto = '';
        let sinal = '';

        if (tipo === 1) {
            classeCor = 'txt-entrada';
            badgeClasse = 'badge-entrada';
            tipoTexto = 'Entrada';
            sinal = '+';
        } else if (tipo === 2) {
            classeCor = 'txt-saida';
            badgeClasse = 'badge-saida';
            tipoTexto = 'Saída'
            sinal = '-';
        } else if (tipo === 3) {
            classeCor = 'txt-entrada-caixa';
            badgeClasse = 'badge-entrada-caixa';
            tipoTexto = 'Guardar na Caixa'
            sinal = '+';
        } else if (tipo === 4) {
            classeCor = 'txt-saida-caixa';
            badgeClasse = 'badge-saida-caixa';
            tipoTexto = 'Retirada da Caixa';
            sinal = '-';
        }

        const dataObjeto = new Date(mov.mov_created_at);
        const dataFormatada = dataObjeto.toLocaleDateString('pt-BR');
        const horaFormatada = dataObjeto.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        tr.innerHTML = `
            <td><span style="color: var(--text-secondary); font-size: 12px;">${dataFormatada} às ${horaFormatada}</span></td>
            <td><span class="badge-tipo ${badgeClasse}">${tipoTexto}</span></td>
            <td><strong>${mov.mov_descricao}</strong></td>
            <td><span class="${classeCor}">${sinal} ${Number(mov.mov_valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// Função para alterar a página das movimentações
function alterarPagina(direcao) {
    paginaAtual += direcao;
    carregarHistorico();
}

// Função para alterar as páginas
function atualizarBotoesPaginacao(totalItens) {
    const btnAnterior = document.getElementById('botao-anterior');
    const btnProximo = document.getElementById('botao-proximo');
    const infoPagina = document.getElementById('info-pagina');

    const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;

    infoPagina.innerText = `Página ${paginaAtual} de ${totalPaginas}`;

    btnAnterior.disabled = (paginaAtual === 1);
    btnProximo.disabled = (paginaAtual >= totalPaginas);
}