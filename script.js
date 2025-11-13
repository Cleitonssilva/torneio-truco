// Aguarda o carregamento completo da página
document.addEventListener('DOMContentLoaded', () => {

    // Chave principal para salvar tudo no navegador
    const TORNEIO_KEY = 'agroSolTorneio2025';

    // --- Referências aos Elementos da Página (DOM) ---
    const adminArea = document.getElementById('adminArea');
    const bracketArea = document.getElementById('bracketArea');
    const thirdPlaceArea = document.getElementById('thirdPlaceArea');
    const thirdPlaceContainer = document.getElementById('thirdPlaceContainer');
    const podiumArea = document.getElementById('podiumArea');

    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const uploadArea = document.getElementById('uploadArea');
    const generateButton = document.getElementById('generateBracketButton');
    const resetButton = document.getElementById('resetTournamentButton');
    const reshuffleButton = document.getElementById('reshuffleButton'); 
    const resetButtonPodium = document.getElementById('resetTournamentButtonPodium'); 
    const downloadPodiumButton = document.getElementById('downloadPodiumButton');
    const messageDisplay = document.getElementById('message');
    const bracketContainer = document.getElementById('bracketContainer');

    const viewBracketButton = document.getElementById('viewBracketButton');
    const viewPodiumButton = document.getElementById('viewPodiumButton');

    const winSound = document.getElementById('winSound');
    const podiumSound = document.getElementById('podiumSound');

    let allTeams = [];
    const allPageSections = document.querySelectorAll('.page-section');

    // --- Funções de UI (Mostrar/Esconder/Mensagens) ---

    function showMessage(msg, type) {
        messageDisplay.textContent = msg;
        messageDisplay.className = `message ${type}`;
        messageDisplay.style.display = 'block';
    }

    function clearMessage() {
        messageDisplay.textContent = '';
        messageDisplay.style.display = 'none';
    }
    
    function showPage(pageId) {
        allPageSections.forEach(section => {
            if (section.id === pageId) {
                section.style.display = 'block';
                setTimeout(() => {
                    section.classList.add('is-visible');
                }, 10);
            } else {
                section.classList.remove('is-visible');
                setTimeout(() => {
                    if (section.id !== pageId) {
                        section.style.display = 'none';
                    }
                }, 500); 
            }
        });
    }

    function showAdminArea() {
        showPage('adminArea');
        thirdPlaceArea.classList.add('hidden'); 
        
        fileInput.value = null; 
        fileNameDisplay.textContent = '';
        messageDisplay.textContent = '';
        messageDisplay.style.display = 'none';
        
        generateButton.disabled = true;
        generateButton.classList.add('button-disabled');
        reshuffleButton.disabled = true; 
        reshuffleButton.classList.add('button-disabled');
    }
    
    function showBracketArea() {
        showPage('bracketArea');
        
        const data = loadState();
        if (data) {
            const finalWinner = data.rounds[data.rounds.length - 1].winner;
            const numRounds = data.rounds.length - 1;
            const minRoundsForThirdPlace = 3; 
            const thirdPlaceWinner = (numRounds < minRoundsForThirdPlace) ? "N/A" : (data.thirdPlaceMatch ? data.thirdPlaceMatch.match.winner : null);

            if (finalWinner && thirdPlaceWinner) {
                viewPodiumButton.style.display = 'inline-block'; 
            } else {
                viewPodiumButton.style.display = 'none'; 
            }
        }
    }

    function showPodiumArea(data) {
        showPage('podiumArea');

        const finalRound = data.rounds[data.rounds.length - 2];
        const finalMatch = finalRound.matches[0];
        
        const winner1st = finalMatch.winner;
        const winner2nd = (finalMatch.winner === finalMatch.team1) ? finalMatch.team2 : finalMatch.team1;
        const winner3rd = data.thirdPlaceMatch.match.winner;

        document.getElementById('winner1st').textContent = winner1st || 'N/A';
        document.getElementById('winner2nd').textContent = winner2nd || 'N/A';
        document.getElementById('winner3rd').textContent = winner3rd || 'N/A';
        
        if (!window.podiumShown) {
            if (podiumSound) podiumSound.play();
            triggerConfetti();
            window.podiumShown = true; 
        }
    }


    // --- Funções de Armazenamento (LocalStorage) ---

    function saveState(data) {
        localStorage.setItem(TORNEIO_KEY, JSON.stringify(data));
    }

    function loadState() {
        const data = localStorage.getItem(TORNEIO_KEY);
        return data ? JSON.parse(data) : null;
    }
    
    function clearState() {
        localStorage.removeItem(TORNEIO_KEY);
        window.podiumShown = false; 
    }

    // --- Funções Principais do Torneio ---

    function handleFileUpload(event) {
        const file = event.target ? event.target.files[0] : event.files[0];
        if (!file) return;

        fileNameDisplay.textContent = `Arquivo: ${file.name}`;
        clearMessage();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (typeof XLSX === 'undefined') {
                    showMessage('ERRO: A biblioteca de Excel (XLSX) não carregou. Verifique a conexão com a internet ou recarregue a página.', 'error');
                    return;
                }
                
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                allTeams = json
                    .slice(1) 
                    .filter(row => row && row[0]) 
                    .map(row => row[0]) 
                    .filter(name => name && typeof name === 'string' && name.trim().length > 0)
                    .map(name => name.trim());
                
                if (allTeams.length < 2) {
                    showMessage(`Erro: A planilha precisa ter pelo menos 2 duplas/jogadores na Coluna A (após o cabeçalho). Encontrados: ${allTeams.length}`, 'error');
                    generateButton.disabled = true;
                    generateButton.classList.add('button-disabled');
                    reshuffleButton.disabled = true;
                    reshuffleButton.classList.add('button-disabled');
                    return;
                }

                const modo = document.querySelector('input[name="modo"]:checked').value;
                if (modo === 'individuais') {
                    if (allTeams.length % 2 !== 0) allTeams.push('BYE');
                    shuffleArray(allTeams);
                    const duplas = [];
                    for (let i = 0; i < allTeams.length; i += 2) {
                        duplas.push(`${allTeams[i]} e ${allTeams[i+1]}`);
                    }
                    allTeams = duplas;
                    showMessage(`Jogadores embaralhados e ${allTeams.length} duplas criadas.`, 'info');
                } else {
                    showMessage(`${allTeams.length} duplas carregadas da planilha.`, 'info');
                }

                const validSizes = [4, 8, 16, 32, 64, 128];
                if (!validSizes.includes(allTeams.length)) {
                    showMessage(`Atenção: Você carregou ${allTeams.length} duplas. Para um chaveamento perfeito, vamos preencher com "Folgas" (BYE).`, 'info');
                    const targetSize = validSizes.find(size => size >= allTeams.length);
                    if (targetSize) {
                        while (allTeams.length < targetSize) {
                            allTeams.push('BYE');
                        }
                    } else {
                        showMessage('Número de equipes muito grande ou inválido.', 'error');
                        return;
                    }
                }

                fileNameDisplay.textContent += ` (${allTeams.length} duplas prontas para o sorteio)`;
                generateButton.disabled = false;
                generateButton.classList.remove('button-disabled');
                reshuffleButton.disabled = false;
                reshuffleButton.classList.remove('button-disabled');

            } catch (error) {
                console.error("Erro ao processar o arquivo Excel:", error);
                showMessage(`ERRO CRÍTICO AO LER O ARQUIVO: ${error.message}. Verifique se é um arquivo .xlsx válido.`, 'error');
                generateButton.disabled = true;
                generateButton.classList.add('button-disabled');
                reshuffleButton.disabled = true;
                reshuffleButton.classList.add('button-disabled');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function reshuffleTeams() {
        if (allTeams.length === 0) {
            showMessage('Carregue um arquivo primeiro para re-embaralhar.', 'error');
            return;
        }
        shuffleArray(allTeams);
        showMessage('Duplas re-embaralhadas com sucesso!', 'success');
    }

    function generateBracket() {
        if (allTeams.length === 0) {
            showMessage('Carregue uma planilha primeiro!', 'error');
            return;
        }

        const numTeams = allTeams.length;
        const numRounds = Math.log2(numTeams);
        
        let tournamentData = { 
            rounds: [],
            thirdPlaceMatch: null 
        };
        let currentTeams = [...allTeams];

        for (let i = numRounds - 1; i >= 0; i--) {
            const roundIndex = (numRounds - 1) - i; // 0, 1, 2, 3...
            
            let roundName = '';
            const numMatchesInRound = Math.pow(2, i);
            
            if (numMatchesInRound === 1) roundName = 'Final';
            else if (numMatchesInRound === 2) roundName = 'Semi-Final';
            else if (numMatchesInRound === 4) roundName = 'Quartas de Final';
            else if (numMatchesInRound === 8) roundName = 'Oitavas de Final';
            else if (numMatchesInRound === 16) roundName = 'Pré-Oitavas';
            else roundName = `Rodada de ${numMatchesInRound * 2}`;

            const round = { name: roundName, matches: [] };
            
            for (let j = 0; j < numMatchesInRound; j++) {
                const match = {
                    id: `${roundIndex}-${j}`,
                    team1: null,
                    team2: null,
                    winner: null,
                    score: null, 
                    nextMatchId: (i > 0) ? `${roundIndex + 1}-${Math.floor(j / 2)}` : null 
                };
                
                if (i === numRounds - 1) { 
                    match.team1 = currentTeams.shift() || null;
                    match.team2 = currentTeams.shift() || null;
                    if (match.team1 === 'BYE') match.winner = match.team2;
                    else if (match.team2 === 'BYE') match.winner = match.team1;
                }
                round.matches.push(match);
            }
            tournamentData.rounds.push(round);
        }
        tournamentData.rounds.push({ name: 'Campeão', winner: null });
        
        // Auto-avança os vencedores de 'BYE' da primeira rodada
        if (tournamentData.rounds.length > 1) {
          const firstRound = tournamentData.rounds[0];
          firstRound.matches.forEach((match, index) => {
            if (match.winner) {
              const [nextRoundIndex, nextMatchIndex] = match.nextMatchId.split('-');
              const nextMatch = tournamentData.rounds[nextRoundIndex].matches[nextMatchIndex];
              
              if (nextMatch) {
                if (index % 2 === 0) nextMatch.team1 = match.winner;
                else nextMatch.team2 = match.winner;
              }
            }
          });
        }
        
        saveState(tournamentData);
        renderBracket(tournamentData);
        showBracketArea();
    }

    function resetTournament() {
        if (confirm('TEM CERTEZA? Isso vai apagar todo o chaveamento e vencedores!')) {
            clearState();
            showAdminArea();
        }
    }

    window.setWinner = function(roundIndex, matchIndex, winnerName) {
        
        const score = prompt(`Definir "${winnerName}" como vencedor?\n\nDigite o placar (ex: 2x1, 3x0):`);

        if (score === null) {
            return; 
        }
        if (score.trim() === "") {
            alert("Por favor, insira um placar para a partida.");
            return;
        }

        const data = loadState();
        if (!data) return;
        
        if(winSound) winSound.play();

        let isFinal = false;
        let isThirdPlace = false;

        if (roundIndex === 'tp') {
            data.thirdPlaceMatch.match.winner = winnerName;
            data.thirdPlaceMatch.match.score = score; 
            isThirdPlace = true;
        } else {
            const match = data.rounds[roundIndex].matches[matchIndex];
            
            if (!match.team1 || !match.team2) {
                alert("Aguarde os dois competidores desta partida serem definidos.");
                return;
            }

            match.winner = winnerName;
            match.score = score; 

            if (match.nextMatchId) {
                const [nextRoundIndex, nextMatchIndex] = match.nextMatchId.split('-');
                const nextMatch = data.rounds[nextRoundIndex].matches[nextMatchIndex];
                const nextTeamSlot = (matchIndex % 2 === 0) ? 'team1' : 'team2';
                nextMatch[nextTeamSlot] = winnerName;
            } else {
                data.rounds[data.rounds.length - 1].winner = winnerName;
                isFinal = true;
            }

            const round = data.rounds[roundIndex];
            if (round.name === 'Semi-Final') {
                const loser = (winnerName === match.team1) ? match.team2 : match.team1;
                const allSemiFinals = data.rounds[roundIndex].matches;
                const otherSemiFinal = allSemiFinals.find(m => m.id !== match.id);

                if (otherSemiFinal && otherSemiFinal.winner) {
                    const otherLoser = (otherSemiFinal.winner === otherSemiFinal.team1) ? otherSemiFinal.team2 : otherSemiFinal.team1;
                    data.thirdPlaceMatch = { 
                        name: 'Disputa de 3º Lugar', 
                        match: { 
                            id: 'tp-0', 
                            team1: loser, 
                            // ===================================
                            // CORREÇÃO DE TYPO APLICADA AQUI
                            // 'otherLosen' -> 'otherLoser'
                            // ===================================
                            team2: otherLoser, 
                            winner: null, 
                            score: null, 
                            nextMatchId: null 
                        } 
                    };
                }
            }
        }
        
        saveState(data);

        const finalWinner = data.rounds[data.rounds.length - 1].winner;
        const thirdPlaceWinner = data.thirdPlaceMatch ? data.thirdPlaceMatch.match.winner : null;
        const numRounds = data.rounds.length - 1;
        const minRoundsForThirdPlace = 3; 
        
        if (numRounds >= minRoundsForThirdPlace) {
             if (finalWinner && thirdPlaceWinner) {
                showPodiumArea(data);
             } else {
                renderBracket(data); 
             }
        } else {
             if (finalWinner) {
                data.thirdPlaceMatch = { match: { winner: "N/A" } }; 
                showPodiumArea(data);
             } else {
                renderBracket(data);
             }
        }
    }

    function renderBracket(data) {
        if (!data || !data.rounds) {
            bracketContainer.innerHTML = `<p class="message info">Aguardando geração do chaveamento...</p>`;
            return;
        }

        bracketContainer.innerHTML = ''; // Limpa o container

        data.rounds.forEach((round, roundIndex) => {
            const roundEl = document.createElement('div');
            roundEl.className = `round round-${roundIndex}`;
            
            const titleEl = document.createElement('div');
            titleEl.className = 'round-title';
            titleEl.textContent = round.name;
            roundEl.appendChild(titleEl);

            if (round.matches) {
                round.matches.forEach((match, matchIndex) => {
                    const matchEl = document.createElement('div');
                    matchEl.className = 'match';
                    
                    const team1El = createTeamElement(match, 'team1', roundIndex, matchIndex);
                    matchEl.appendChild(team1El);
                    const team2El = createTeamElement(match, 'team2', roundIndex, matchIndex);
                    matchEl.appendChild(team2El);

                    if (match.winner && match.score) {
                        const scoreEl = document.createElement('div');
                        scoreEl.className = 'match-score';
                        scoreEl.textContent = `Placar: ${match.score}`;
                        matchEl.appendChild(scoreEl);
                    }
                    
                    roundEl.appendChild(matchEl);
                });
            } else if (round.winner) {
                roundEl.className = `round campeao`;
                const matchEl = document.createElement('div');
                matchEl.className = 'match';
                matchEl.innerHTML = `<div class="team winner">🏆 ${round.winner} 🏆</div>`;
                roundEl.appendChild(matchEl);
            }
            bracketContainer.appendChild(roundEl);
        });

        if (data.thirdPlaceMatch) {
            renderThirdPlaceMatch(data.thirdPlaceMatch);
        } else {
            thirdPlaceArea.classList.add('hidden');
        }
    }

    function renderThirdPlaceMatch(tpData) {
        thirdPlaceArea.classList.remove('hidden');
        thirdPlaceContainer.innerHTML = ''; 

        const roundEl = document.createElement('div');
        roundEl.className = `round round-tp`;
        
        const match = tpData.match;
        const matchEl = document.createElement('div');
        matchEl.className = 'match';

        const team1El = createTeamElement(match, 'team1', "'tp'", 0);
        matchEl.appendChild(team1El);
        const team2El = createTeamElement(match, 'team2', "'tp'", 0);
        matchEl.appendChild(team2El);

        if (match.winner && match.score) {
            const scoreEl = document.createElement('div');
            scoreEl.className = 'match-score';
            scoreEl.textContent = `Placar: ${match.score}`;
            matchEl.appendChild(scoreEl);
        }

        roundEl.appendChild(matchEl);
        thirdPlaceContainer.appendChild(roundEl);
    }

    function createTeamElement(match, teamKey, roundIndex, matchIndex) {
        const name = match[teamKey];
        const winner = match.winner;
        
        const el = document.createElement('div');
        el.className = 'team';
        const teamName = name || 'Aguardando...';
        
        if (teamName === 'BYE') el.classList.add('bye');
        if (name && name === winner && name !== 'BYE') el.classList.add('winner');

        const nameSpan = document.createElement('span');
        nameSpan.className = 'team-name';
        nameSpan.textContent = teamName;
        el.appendChild(nameSpan);

        if (name && name !== 'BYE' && !winner && match.team1 && match.team2) {
            const button = document.createElement('button');
            button.className = 'admin-winner-button';
            button.textContent = 'Vencedor';
            button.setAttribute('onclick', `window.setWinner(${roundIndex}, ${matchIndex}, '${name.replace(/'/g, "\\'")}')`);
            el.appendChild(button);
        }
        
        return el;
    }

    // --- Funções de Inicialização e Efeitos ---

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    function triggerConfetti() {
        if (typeof confetti !== 'function') return; 
        
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
        });
    }
    
    function downloadPodium() {
        if (typeof html2canvas !== 'function') {
            alert("Erro: Biblioteca de download não carregou. Verifique sua conexão.");
            return;
        }
        
        const podiumElement = document.getElementById('podiumContainerToSave');
        
        html2canvas(podiumElement, { 
            backgroundColor: "#f4f4f4" 
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'podio-encontro-agrosol-2025.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }


    // Drag and Drop
    uploadArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadArea.classList.add('highlight');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('highlight');
    });
    uploadArea.addEventListener('drop', (event) => {
        event.preventDefault();
        uploadArea.classList.remove('highlight');
        fileInput.files = event.dataTransfer.files;
        handleFileUpload(event.dataTransfer);
    });

    // --- Ponto de Partida (Ao Carregar a Página) ---
    
    fileInput.addEventListener('change', handleFileUpload);
    reshuffleButton.addEventListener('click', reshuffleTeams); 
    generateButton.addEventListener('click', generateBracket);
    resetButton.addEventListener('click', resetTournament);
    resetButtonPodium.addEventListener('click', resetTournament);
    downloadPodiumButton.addEventListener('click', downloadPodium);
    
    viewBracketButton.addEventListener('click', () => {
        const data = loadState();
        if (data) {
            renderBracket(data); 
            showBracketArea();   
        } else {
            showAdminArea(); 
        }
    });

    viewPodiumButton.addEventListener('click', () => {
        const data = loadState();
        if (data) {
            showPodiumArea(data); 
        } else {
            showAdminArea(); 
        }
    });

    // ===========================================
    // LÓGICA (TEMA AUTOMÁTICO) - MANTIDA
    // ===========================================
    function startThemeCycling() {
        let currentTheme = 1;
        setInterval(() => {
            currentTheme++;
            if (currentTheme > 5) currentTheme = 1;
            document.body.className = `theme-${currentTheme}`;
        }, 60000); // Muda a cada 60 segundos (1 minuto)
    }

    // ===========================================
    // LÓGICA (PAINEL OCIOSO) - MODIFICADA
    // ===========================================
    let idleTimer;
    let idleLoopInterval;
    let currentScroll = 0;
    let scrollDirection = 1; // 1 = para direita, -1 = para esquerda
    const scrollSpeed = 1; // pixels por frame

    function startIdleLoop() {
        // Limpa loops antigos
        if (idleLoopInterval) clearInterval(idleLoopInterval);
        
        idleLoopInterval = setInterval(() => {
            const data = loadState();
            if (!data) return; // Não faz nada se não houver torneio

            // 1. Lógica de Auto-Scroll no Chaveamento (MANTIDA)
            if (bracketArea.classList.contains('is-visible')) {
                const bracket = document.getElementById('bracketContainer');
                const maxScroll = bracket.scrollWidth - bracket.clientWidth;

                if (maxScroll > 0) {
                    currentScroll += (scrollSpeed * scrollDirection);
                    
                    if (currentScroll >= maxScroll) {
                        currentScroll = maxScroll;
                        scrollDirection = -1; // Volta
                    } else if (currentScroll <= 0) {
                        currentScroll = 0;
                        scrollDirection = 1; // Vai
                    }
                    bracket.scrollTo({ left: currentScroll, behavior: 'smooth' });
                }
            }
            
            // 2. Lógica de troca de tela (REMOVIDA)
            
        }, 100); // Roda o scroll/check a cada 100ms
    }

    function resetIdleTimer() {
        if (idleLoopInterval) clearInterval(idleLoopInterval);
        clearTimeout(idleTimer);
        // Inicia o loop de ociosidade após 15 segundos sem mexer
        idleTimer = setTimeout(startIdleLoop, 15000); 
    }

    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('click', resetIdleTimer);
    document.addEventListener('keypress', resetIdleTimer);
    resetIdleTimer(); // Inicia pela primeira vez

    // --- LÓGICA DE INICIALIZAÇÃO ---
    
    window.podiumShown = false; 

    // INICIA O CICLO DE TEMAS
    startThemeCycling();

    // Verifica se já existe um torneio salvo
    const existingData = loadState();
    if (existingData) {
        const finalWinner = existingData.rounds[existingData.rounds.length - 1].winner;
        const numRounds = existingData.rounds.length - 1;
        const minRoundsForThirdPlace = 3; 
        const thirdPlaceWinner = (numRounds < minRoundsForThirdPlace) ? "N/A" : (existingData.thirdPlaceMatch ? existingData.thirdPlaceMatch.match.winner : null);

        if (finalWinner && thirdPlaceWinner) {
            showPodiumArea(existingData);
        } else {
            renderBracket(existingData);
            showBracketArea();
        }
    } else {
        showAdminArea();
    }
});