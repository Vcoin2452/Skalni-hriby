document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const slidesWrapper = document.getElementById('slides-wrapper');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const dotsContainer = document.getElementById('dots');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    let isAnimating = false;

    // Vytvoření navigačních teček
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if(index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    function updateUI() {
        // Aktualizace pozice wrapperu
        slidesWrapper.style.transform = `translateY(-${currentSlide * 100}vh)`;
        
        // Active třídy pro slajdy (spustí CSS animace obsahu)
        slides.forEach((slide, index) => {
            if(index === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // Aktualizace teček
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });

        // Stav tlačítek šipek
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === totalSlides - 1;
        
        // Přečíst text nového slajdu
        if (isVoiceEnabled) {
            synth.cancel();
            setTimeout(() => {
                if(!isAnimating && isVoiceEnabled) readCurrentSlide();
            }, 600); // Mírné zpoždění, aby nejdřív dojela animace přesunu obrazovky
        }
        
        // Resetujeme příznak animace po dokončení přechodu
        setTimeout(() => {
            isAnimating = false;
        }, 800);
    }

    function goToSlide(index) {
        if(index < 0 || index >= totalSlides || isAnimating || index === currentSlide) return;
        isAnimating = true;
        currentSlide = index;
        updateUI();
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // Event listenery pro šipky myší
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Klávesnicová navigace (šipky a mezerník)
    window.addEventListener('keydown', (e) => {
        if(e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
            e.preventDefault();
            nextSlide();
        } else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            prevSlide();
        }
    });

    // Podpora rolování kolečkem myši (s prevencí příliš rychlých skoků)
    window.addEventListener('wheel', (e) => {
        if(isAnimating) return;
        if(e.deltaY > 50) {
            nextSlide();
        } else if(e.deltaY < -50) {
            prevSlide();
        }
    }, { passive: false });

    // Fullscreen podpora
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Chyba při pokusu o zobrazení na celou obrazovku: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    /* ====== VOICE OVER FUNKCIONALITA ====== */
    const voiceBtn = document.getElementById('voice-btn');
    let isVoiceEnabled = false;
    const synth = window.speechSynthesis;
    let czechVoice = null;

    // Najití kvalitního českého hlasu
    function loadVoices() {
        const voices = synth.getVoices();
        // Priority: Google čeština (bývá nejplynulejší v Chrome), pak Premium/Enhanced verze od Applu (Iveta, Zuzana Premium), až pak základní.
        czechVoice = voices.find(v => v.lang === 'cs-CZ' && v.name.includes('Google')) ||
                     voices.find(v => v.lang === 'cs-CZ' && (v.name.includes('Premium') || v.name.includes('Enhanced'))) ||
                     voices.find(v => v.lang === 'cs-CZ' && v.name.includes('Iveta')) ||
                     voices.find(v => v.lang === 'cs-CZ' && v.name.includes('Zuzana')) ||
                     voices.find(v => v.lang.includes('cs'));
    }
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    function speakText(text) {
        synth.cancel(); // Stop anything currently playing
        if (!isVoiceEnabled || !text) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (czechVoice) utterance.voice = czechVoice;
        utterance.lang = 'cs-CZ';
        utterance.rate = 0.9; // Pomalejší a přirozenější přednes 
        utterance.pitch = 1.0;
        synth.speak(utterance);
    }

    // Extrakce textu aktuálního slajdu
    function readCurrentSlide() {
        const slide = slides[currentSlide];
        let textToRead = "";
        
        const mainTitle = slide.querySelector('.main-title');
        if (mainTitle) textToRead += mainTitle.textContent.replace('(', '').replace(')', '') + ". ";
        
        const plantTitle = slide.querySelector('.plant-title');
        if (plantTitle) textToRead += plantTitle.textContent.replace('(', '').replace(')', '') + ". ";

        const paragraphs = slide.querySelectorAll('.intro-description, .feature-card h3, .feature-card p, .data-list li');
        paragraphs.forEach(p => {
            // Skrytí latinských doplňků nebo znaků, které se špatně čtou
            textToRead += p.textContent.replace(/\(.*?\)/g, '') + ". ";
        });
        
        speakText(textToRead.trim().replace(/\s+/g, ' '));
    }

    // Toggle Voice Over button
    voiceBtn.addEventListener('click', () => {
        isVoiceEnabled = !isVoiceEnabled;
        if(isVoiceEnabled) {
            voiceBtn.classList.add('voice-active');
            readCurrentSlide(); // Přečte aktuální po zapnutí
        } else {
            voiceBtn.classList.remove('voice-active');
            synth.cancel(); // Zastaví okamžitě
        }
    });

    // Přečtení obsahu Flip-Cards po najetí/otevření
    const flipCards = document.querySelectorAll('.flip-card');
    flipCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if(!isVoiceEnabled) return;
            const backTextElement = card.querySelector('.flip-card-back');
            if(backTextElement) {
                // Přebytečné prázdné znaky pryč
                const text = backTextElement.textContent.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ');
                speakText(text);
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if(isVoiceEnabled) synth.cancel(); // Zastaví při opuštění karty
        });
    });

});
