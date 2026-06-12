// Executa
document.addEventListener("DOMContentLoaded", () => {
    carregarValoresRecorrentes();
    atualizarDashboard();
    exibirTransacoes();
});

// Função buscar e exibir recorrentes ativos do banco
async function carregarValoresRecorrentes() {
    console.log("Buscando valores recorrentes ativos...");

    const { data: recorrentes, error } = await supabase
        .from('recorrentes')
        .select('rec_valor, rec_tipo')
        .eq('rec_status', true);

    if (error) {
        console.error("Erro ao buscar recorrentes: ", error.message);
        return;
    }

    let totalEntradasRecorrentes = 0;
    let totalSaidasRecorrentes = 0;

    recorrentes.forEach(item => {
        if (item.rec_tipo === 1) {  // Entradas
            totalEntradasRecorrentes += Number(item.rec_valor);
        } else if (item.rec_tipo === 2) {   // Saídas
            totalSaidasRecorrentes += Number(item.rec_valor);
        }
    });

    const elEntradaRecorrente = document.getElementById('recorrente-entrada-valor');
    const elSaidaRecorrente = document.getElementById('recorrente-saida-valor');

    if (elEntradaRec) elEntradaRec.innerText = totalEntradasRec.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (elSaidaRec) elSaidaRec.innerText = totalSaidasRec.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para salvar as movimentações no Supabase
async function salvarTransacao(descricao, valor, tipoId) {
    console.log(`Inserindo movimentação: ${descricao} - R$ ${valor} (Tipo: ${tipoId})`);

    const { error } = await supabase
        .from('movimentacoes')
        .insert([
            {
                mov_descricao: descricao,
                mov_valor: parseFloat(valor),
                mov_tipo: parseInt(tipoId),
                mov_status: true
                // mov_categoria (ADICIONAR)
            }
        ]);

    if (error) {
        console.error("Erro ao salvar movimentação no Supabase:", error.message);
        alert("Erro ao salvar no banco de dados. Verifique suas políticas de RLS para INSERT.");
        return;
    }

    console.log("Movimentação salva com sucesso!");

    atualizarDashboard();
    exibirTransacoes();
}

// Função para calcular o saldo
async function atualizarDashboard() {
    console.log("Calculando saldo atual...");

    const { data: movimentacoes, error } = await supabase
        .from('movimentacoes')
        .select('mov_valor, mov_tipo');

    if (error) {
        console.error("Erro ao buscar movimentações para o saldo:", error.message);
        return;
    }

    let entradasTotal = 0;
    let saidasTotal = 0;

    movimentacoes.forEach(mov => {
        if (mov.mov_tipo === 1) {
            entradasTotal += Number(mov.mov_valor);
        } else if (mov.mov_tipo === 2) {
            saidasTotal += Number(mov.mov_valor);
        }
    });

    const saldoTotal = entradasTotal - saidasTotal;
    const elSaldo = document.getElementById('saldo-atual-carteira');

    if (elSaldo) {
        elSaldo.innerText = saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        elSaldo.style.color = saldoTotal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
}

// Funçãr para listar as últimas 5 movimentações
async function exibirTransacoes() {
    const listaElemento = document.getElementById('lista-transacoes');
    if (!listaElemento) return;

    console.log("Buscando as últimas 5 transações...");

    const { data: transacoes, error } = await supabase
        .from('movimentacoes')
        .select('mov_created_at, mov_descricao, mov_valor, mov_tipo')
        .order('mov_created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Erro ao carregar transações recentes:", error.message);
        return;
    }

    listaElemento.innerHTML = "";

    if (!transacoes || transacoes.length === 0) {
        listaElemento.innerHTML = '<p class="empty-msg">Nenhuma movimentação realizada.</p>';
        return;
    }

    transacoes.forEach(transacao => {
        const item = document.createElement('div');
        item.classList.add('item-transacao');

        const isEntrada = transacao.mov_tipo === 1;
        const corClasse = isEntrada ? 'txt-entrada' : 'txt-saida';
        const sinal = isEntrada ? '+' : '-';

        const dataFormatada = new Date(transacao.mov_created_at).toLocaleDateString('pt-BR');

        item.innerHTML = `
            <div class="info-esquerda">
                <span class="data-transacao">${dataFormatada}</span>
                <strong class="desc-transacao">${transacao.mov_descricao}</strong>
            </div>
            <div class="info-direita">
                <span class="valor-transacao ${corClasse}">
                    ${sinal} ${Number(transacao.mov_valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>
        `;
        listaElemento.appendChild(item);
    });
}

// Formulário de entrada
const formEntrada = document.getElementById('form-entrada');
if (formEntrada) {
    formEntrada.addEventListener('submit', async (e) => {
        e.preventDefault();
        const desc = document.getElementById('desc-entrada').value;
        const valor = document.getElementById('valor-entrada').value;

        await salvarTransacao(desc, valor, 1);
        formEntrada.reset();
    });
}

// Formulário de saída
const formSaida = document.getElementById('form-saida');
if (formSaida) {
    formSaida.addEventListener('submit', async (e) => {
        e.preventDefault();
        const desc = document.getElementById('desc-saida').value;
        const valor = document.getElementById('valor-saida').value;

        await salvarTransacao(desc, valor, 2);
        formSaida.reset();
    });
}