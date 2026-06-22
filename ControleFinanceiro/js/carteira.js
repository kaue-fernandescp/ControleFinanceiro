// Executa
document.addEventListener("DOMContentLoaded", async () => {
    await carregarCategoriasDropdown();
    await carregarValoresRecorrentes();
    await atualizarDashboard();
    await exibirTransacoes();
});

// Função buscar e exibir recorrentes ativos do banco
async function carregarValoresRecorrentes() {
    console.log("Buscando valores recorrentes ativos...");

    const { data: recorrentes, error } = await supabase
        .from('recorrentes')
        .select('rec_nome, rec_valor, rec_tipo')
        .eq('rec_status', true);

    if (error) {
        console.error("Erro ao buscar recorrentes: ", error.message);
        return;
    }

    const containerEntradas = document.getElementById('lista-entradas-recorrentes');
    const containerSaidas = document.getElementById('lista-saidas-recorrentes');

    if (!containerEntradas || !containerSaidas) return;

    containerEntradas.innerHTML = "";
    containerSaidas.innerHTML = "";

    if (!recorrentes || recorrentes.length === 0) {
        containerEntradas.innerHTML = '<p class="vazio" style="font-size: 13px; color: var(--text-secondary);">Nenhum item ativo.</p>';
        containerSaidas.innerHTML = '<p class="vazio" style="font-size: 13px; color: var(--text-secondary);">Nenhum item ativo.</p>';
        return;
    }

    recorrentes.forEach(item => {
        const valorFormatado = Number(item.rec_valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const linhaHTML = `
            <div class="item-recorrente-linha">
                <h4>${item.rec_nome}</h4>
                <p>${valorFormatado}</p>
            </div>
        `;

        if (item.rec_tipo === 1) {
            containerEntradas.innerHTML += linhaHTML;
        } else if (item.rec_tipo === 2) {
            containerSaidas.innerHTML += linhaHTML;
        }
    });

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

    if (elEntradaRecorrente) elEntradaRecorrente.innerText = totalEntradasRecorrentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (elSaidaRecorrente) elSaidaRecorrente.innerText = totalSaidasRecorrentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para salvar as movimentações no Supabase
async function salvarTransacao(descricao, valor, tipoId, categoriaId) {
    console.log(`Inserindo movimentação: ${descricao} - R$ ${valor} (Tipo: ${tipoId}, Cat: ${categoriaId})`);

    if (!categoriaId || categoriaId === "") {
        alert("Por favor, selecione uma categoria antes de salvar.");
        return;
    }

    const { error } = await supabase
        .from('movimentacoes')
        .insert([
            {
                mov_descricao: descricao,
                mov_valor: parseFloat(valor),
                mov_tipo: parseInt(tipoId),
                mov_categoria: parseInt(categoriaId),
                mov_status: false,
            }
        ]);

    if (error) {
        console.error("Erro ao salvar movimentação no Supabase:", error.message);
        alert("Erro ao salvar no banco de dados. Verifique suas políticas de RLS para INSERT.");
        return;
    }

    console.log("Movimentação salva com sucesso!");

    await carregarValoresRecorrentes();
    await atualizarDashboard();
    await exibirTransacoes();
}

// Função para calcular o saldo
async function atualizarDashboard() {
    console.log("Calculando saldo atual...");

    const { data: movimentacoes, error: erroMov } = await supabase
        .from('movimentacoes')
        .select('mov_valor, mov_tipo');

    if (erroMov) {
        console.error("Erro ao buscar movimentações para o saldo:", erroMov.message);
        return;
    }

    const { data: recorrentes, error: erroRec } = await supabase
        .from('recorrentes')
        .select('rec_valor, rec_tipo')
        .eq('rec_status', true);

    if (erroRec) {
        console.log("Erro ao buscar recorrentes para o saldo: ", erroRec.message);
        return;
    }

    let entradasTotal = 0;
    let saidasTotal = 0;

    if (recorrentes) {
        recorrentes.forEach(item => {
            if (item.rec_tipo === 1) {
                entradasTotal += Number(item.rec_valor);
            } else if (item.rec_tipo === 2) {
                saidasTotal += Number(item.rec_valor);
            }
        });    
    }
    
    if (movimentacoes) {
        movimentacoes.forEach(mov => {
            if (mov.mov_tipo === 1) {
                entradasTotal += Number(mov.mov_valor);
            } else if (mov.mov_tipo === 2) {
                saidasTotal += Number(mov.mov_valor);
            }
        }); 
    }
    

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

// Função para carregar as categorias no formulário
async function carregarCategoriasDropdown() {
    console.log("Buscando categorias para o dropdown...");

    const { data: categorias, error } = await supabase
        .from('categorias')
        .select('cat_id, cat_nome');

    if (error) {
        console.error("Erro ao buscar categorias: ", error.message);
        return;
    }

    const selectEntrada = document.getElementById('categoria-entrada');
    const selectSaida = document.getElementById('categoria-saida');
    
    selectEntrada.innerHTML = '<option value="" disabled selected>Categoria</option>';
    selectSaida.innerHTML = '<option value="" disabled selected>Categoria</option>';

    categorias.forEach(cat => {
        const opcaoEntrada = document.createElement('option');
        opcaoEntrada.value = cat.cat_id;
        opcaoEntrada.textContent = cat.cat_nome;
        selectEntrada.appendChild(opcaoEntrada);

        const opcaoSaida = document.createElement('option');
        opcaoSaida.value = cat.cat_id;
        opcaoSaida.textContent = cat.cat_nome;
        selectSaida.appendChild(opcaoSaida);
    });
}

// Formulário de entrada
const formEntrada = document.getElementById('form-entrada');
if (formEntrada) {
    formEntrada.addEventListener('submit', async (e) => {
        e.preventDefault();
        const desc = document.getElementById('desc-entrada').value;
        const valor = document.getElementById('valor-entrada').value;
        const categoriaId = document.getElementById('categoria-entrada').value;

        await salvarTransacao(desc, valor, 1, categoriaId);
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
        const categoriaId = document.getElementById('categoria-saida').value;

        await salvarTransacao(desc, valor, 2, categoriaId);
        formSaida.reset();
    });
}