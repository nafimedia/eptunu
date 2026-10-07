Add-Type -AssemblyName System.Speech

$webAudioDir = "c:\Users\user\Documents\laragon\www\eptunu\apps\web\static\audio"
$apiAudioDir = "c:\Users\user\Documents\laragon\www\eptunu\apps\api\storage\audio"

if (-not (Test-Path $webAudioDir)) { New-Item -ItemType Directory -Force -Path $webAudioDir | Out-Null }
if (-not (Test-Path $apiAudioDir)) { New-Item -ItemType Directory -Force -Path $apiAudioDir | Out-Null }

function New-DialogueAudio {
    param (
        [string]$Filename,
        [string]$Speaker1Voice, # "Microsoft David Desktop" or "Microsoft Zira Desktop"
        [string]$Speaker1Text,
        [string]$Speaker2Voice,
        [string]$Speaker2Text,
        [string]$NarratorVoice,
        [string]$NarratorText
    )

    $tempPath = Join-Path $webAudioDir $Filename
    $apiPath  = Join-Path $apiAudioDir $Filename

    Write-Host "Synthesizing $Filename..."

    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.SetOutputToWaveFile($tempPath)
    $synth.Rate = -1

    # Speaker 1
    $synth.SelectVoice($Speaker1Voice)
    $synth.Speak($Speaker1Text)
    Start-Sleep -Milliseconds 400

    # Speaker 2
    $synth.SelectVoice($Speaker2Voice)
    $synth.Speak($Speaker2Text)
    Start-Sleep -Milliseconds 600

    # Narrator
    $synth.SelectVoice($NarratorVoice)
    $synth.Speak($NarratorText)

    $synth.Dispose()

    # Copy to API storage as well
    Copy-Item -Path $tempPath -Destination $apiPath -Force
    $size = (Get-Item $tempPath).Length
    Write-Host " -> OK: $Filename ($size bytes)"
}

function New-LectureAudio {
    param (
        [string]$Filename,
        [string]$NarratorVoice,
        [string]$IntroText,
        [string]$SpeakerVoice,
        [string]$LectureText,
        [string]$OutroText
    )

    $tempPath = Join-Path $webAudioDir $Filename
    $apiPath  = Join-Path $apiAudioDir $Filename

    Write-Host "Synthesizing Lecture $Filename..."

    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.SetOutputToWaveFile($tempPath)
    $synth.Rate = -1

    # Intro
    $synth.SelectVoice($NarratorVoice)
    $synth.Speak($IntroText)
    Start-Sleep -Milliseconds 600

    # Lecture
    $synth.SelectVoice($SpeakerVoice)
    $synth.Speak($LectureText)
    Start-Sleep -Milliseconds 700

    # Outro
    $synth.SelectVoice($NarratorVoice)
    $synth.Speak($OutroText)

    $synth.Dispose()

    # Copy to API storage
    Copy-Item -Path $tempPath -Destination $apiPath -Force
    $size = (Get-Item $tempPath).Length
    Write-Host " -> OK: $Filename ($size bytes)"
}

Write-Host "============================================="
Write-Host "Generating Realistic TOEFL ITP Audio Samples"
Write-Host "============================================="

# --- PART A (Short Conversations) ---

New-DialogueAudio `
    -Filename "listening_part_a_01.wav" `
    -Speaker1Voice "Microsoft David Desktop" `
    -Speaker1Text "Excuse me, do you know if the shuttle to the north campus is still running?" `
    -Speaker2Voice "Microsoft Zira Desktop" `
    -Speaker2Text "It stops at five, but the city bus on Green Street runs until midnight." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What does the woman imply the man should do?"

New-DialogueAudio `
    -Filename "listening_part_a_02.wav" `
    -Speaker1Voice "Microsoft Zira Desktop" `
    -Speaker1Text "I'm really worried about tomorrow's biology midterm. There's just too much terminology to memorize!" `
    -Speaker2Voice "Microsoft David Desktop" `
    -Speaker2Text "If you want, a few of us are forming a study group at the central library tonight. You're more than welcome to join." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What does the man suggest the woman do?"

New-DialogueAudio `
    -Filename "listening_part_a_03.wav" `
    -Speaker1Voice "Microsoft David Desktop" `
    -Speaker1Text "Did you manage to get Professor Wilson's permission to submit your research proposal late?" `
    -Speaker2Voice "Microsoft Zira Desktop" `
    -Speaker2Text "Hardly. He made it abundantly clear that deadlines are strictly non-negotiable." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What does the woman mean?"

New-DialogueAudio `
    -Filename "listening_part_a_04.wav" `
    -Speaker1Voice "Microsoft Zira Desktop" `
    -Speaker1Text "The line at the financial aid office was out the door this morning." `
    -Speaker2Voice "Microsoft David Desktop" `
    -Speaker2Text "Tell me about it! I spent nearly an hour in line just to drop off a single verification document." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What does the man mean?"

New-DialogueAudio `
    -Filename "listening_part_a_05.wav" `
    -Speaker1Voice "Microsoft David Desktop" `
    -Speaker1Text "I was hoping to check out this reference handbook for my literature review, but the desk attendant said it's non-circulating." `
    -Speaker2Voice "Microsoft Zira Desktop" `
    -Speaker2Text "Well, the scanner in the corner is free to use for students, so you can easily save the chapters you need as PDFs." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What does the woman suggest?"

New-DialogueAudio `
    -Filename "listening_part_a_06.wav" `
    -Speaker1Voice "Microsoft Zira Desktop" `
    -Speaker1Text "Have you checked the forecast for our geology field trip on Saturday?" `
    -Speaker2Voice "Microsoft David Desktop" `
    -Speaker2Text "Thunderstorms all day long. I'm afraid we'll have to take a rain check on that excursion." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What does the man indicate?"

New-DialogueAudio `
    -Filename "listening_part_a_07.wav" `
    -Speaker1Voice "Microsoft David Desktop" `
    -Speaker1Text "I heard you accepted an internship at the biotechnology laboratory while taking eighteen credits!" `
    -Speaker2Voice "Microsoft Zira Desktop" `
    -Speaker2Text "Yes, and to be honest, I'm beginning to realize I may have bitten off more than I can chew." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What is the woman's problem?"

New-DialogueAudio `
    -Filename "listening_part_a_08.wav" `
    -Speaker1Voice "Microsoft Zira Desktop" `
    -Speaker1Text "Could you lend me your lecture notes from yesterday's macroeconomics class? My laptop battery died right after attendance." `
    -Speaker2Voice "Microsoft David Desktop" `
    -Speaker2Text "I would if I could, but my shorthand is such a mess that even I can barely make heads or tails of it." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What does the man imply?"

New-DialogueAudio `
    -Filename "listening_part_a_09.wav" `
    -Speaker1Voice "Microsoft David Desktop" `
    -Speaker1Text "Are you thinking about applying for on-campus housing next academic year?" `
    -Speaker2Voice "Microsoft Zira Desktop" `
    -Speaker2Text "I'd love to, but dorm applications closed last Friday, so that ship has sailed." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What does the woman mean?"

New-DialogueAudio `
    -Filename "listening_part_a_10.wav" `
    -Speaker1Voice "Microsoft Zira Desktop" `
    -Speaker1Text "Dr. Bennett's lecture on cognitive neuroscience was fascinating, don't you think?" `
    -Speaker2Voice "Microsoft David Desktop" `
    -Speaker2Text "You can say that again! I had no idea neural plasticity played such a pivotal role in language acquisition." `
    -NarratorVoice "Microsoft David Desktop" `
    -NarratorText "What does the man mean?"

# --- PART B (Long Conversation) ---
Write-Host "Synthesizing Part B Long Conversation..."
$partBPath = Join-Path $webAudioDir "listening_part_b_01.wav"
$partBApi  = Join-Path $apiAudioDir "listening_part_b_01.wav"

$synthB = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synthB.SetOutputToWaveFile($partBPath)
$synthB.Rate = -1

# Narrator Intro
$synthB.SelectVoice("Microsoft David Desktop")
$synthB.Speak("Questions 11 through 14. Listen to a conversation between a university student and her academic advisor.")
Start-Sleep -Milliseconds 600

# Dialogue
$synthB.SelectVoice("Microsoft Zira Desktop")
$synthB.Speak("Good morning, Dr. Harrison. Thanks for seeing me on such short notice.")
Start-Sleep -Milliseconds 400

$synthB.SelectVoice("Microsoft David Desktop")
$synthB.Speak("Of course, Rebecca. Come on in. What seems to be the trouble?")
Start-Sleep -Milliseconds 400

$synthB.SelectVoice("Microsoft Zira Desktop")
$synthB.Speak("Well, I'm trying to finalize my course registration for the upcoming semester, and I'm running into an issue with the online system. I want to enroll in Advanced Environmental Chemistry, but the system keeps blocking me, citing a missing prerequisite.")
Start-Sleep -Milliseconds 400

$synthB.SelectVoice("Microsoft David Desktop")
$synthB.Speak("Let me pull up your academic record on my monitor here. Ah, I see. Have you completed General Organic Chemistry Two?")
Start-Sleep -Milliseconds 400

$synthB.SelectVoice("Microsoft Zira Desktop")
$synthB.Speak("I actually took an equivalent course at the regional community college last summer before transferring here to UNU. My previous credits were evaluated and approved, but apparently the organic chemistry laboratory component wasn't officially mapped into the university database.")
Start-Sleep -Milliseconds 400

$synthB.SelectVoice("Microsoft David Desktop")
$synthB.Speak("I understand. That happens occasionally when credit transfers involve separate lecture and laboratory units. Here is what we can do: if you bring me the official course syllabus and your lab transcript from that community college by Thursday, I can sign an academic override waiver. That will authorize the registrar's office to manually register you for the lecture.")
Start-Sleep -Milliseconds 400

$synthB.SelectVoice("Microsoft Zira Desktop")
$synthB.Speak("That would be a huge relief, Dr. Harrison! The course only accommodates thirty students, and twenty-five seats are already filled. I'll print out the syllabus and bring it to your office tomorrow morning.")
Start-Sleep -Milliseconds 400

$synthB.SelectVoice("Microsoft David Desktop")
$synthB.Speak("Sounds like a solid plan. Don't delay, because once enrollment hits the maximum cap of thirty, even an advisor override won't guarantee a seat.")
Start-Sleep -Milliseconds 600

$synthB.Dispose()
Copy-Item -Path $partBPath -Destination $partBApi -Force
Write-Host " -> OK: listening_part_b_01.wav ($((Get-Item $partBPath).Length) bytes)"

# --- PART C (Academic Mini-Lecture) ---
New-LectureAudio `
    -Filename "listening_part_c_01.wav" `
    -NarratorVoice "Microsoft David Desktop" `
    -IntroText "Questions 15 through 18. Listen to a lecture delivered by a geology professor in an earth science course." `
    -SpeakerVoice "Microsoft David Desktop" `
    -LectureText "Good afternoon, class. Today we will examine one of the most remarkable wind-sculpted geological landforms found in arid environments: the yardang. A yardang is an elongated, streamlined ridge of bedrock or hardened cohesive sediment that has been carved predominantly by wind erosion, a process geologists term deflation and abrasion. Unlike sand dunes, which are depositional landforms constructed by the accumulation of sand grains transported by wind currents, yardangs are erosional features formed when persistent, unidirectional winds strip away weaker rock layers, leaving behind ridges of denser, more resistant strata. In morphology, a mature yardang bears a striking resemblance to the inverted hull of a boat, with a rounded, blunt prow facing upwind and a tapered tail pointing downwind. Remarkably, yardang formations are not confined to Earth. High-resolution imagery captured by Mars orbiters has identified vast fields of yardangs across Martian terrain, particularly in the Medusae Fossae Formation. Because yardangs preserve evidence of wind direction and sediment resistance over geological eras, studying these Martian structures offers scientists valuable clues regarding the ancient atmosphere, climate history, and atmospheric dynamics of the Red Planet." `
    -OutroText "Now, answer the questions based on the lecture."

Write-Host "All audio files generated successfully!"
