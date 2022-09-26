import docxParser from "docx-parser";
import fs from "fs";
import docx from "docx";

const filesPath = "./files";
const distPath = "./dist";

const extractQuestions = (test) => {
  const questions = test
    .replace("[Info]", "")
    .trim()
    .split("]\n\n")
    .map((q) => q.trim());

  return questions;
};

const shuffle = (array) => {
  return array.sort((a, b) => 0.5 - Math.random());
};

const extractAnswers = (answersString) => {
  if (!answersString) return [];

  // remove last line
  answersString = answersString.substring(0, answersString.lastIndexOf("\n"));

  return answersString.split("[a]\n").map((a) => a.replace(/\n/g, ""));
};

const getAnswersString = (answersArray) => {
  return answersArray
    .reduce((acc, val) => {
      return `${acc}
[a]    
${val}`;
    }, "")
    .trim();
};

const hideAnswers = (testQuestion) => {
  const [question, answersString] = testQuestion.trim().split(/\[q\d+\]/);

  const singleAnswerMatch = answersString?.match(/\[התשובה:?\s*(\W+)/);

  if (singleAnswerMatch) {
    return question.trim();
  }

  const shuffledAnswers = shuffle(extractAnswers(answersString));

  const shuffledAnswersString = getAnswersString(shuffledAnswers);

  return `${question.trim()}
${shuffledAnswersString}`;
};

const getFinalFileContent = (fixedQuestions) => {
  return fixedQuestions
    .reduce((acc, val) => {
      return `${acc}

${val}`;
    }, "")
    .trim();
};

const writeDocxFile = (filePath, questions) => {
  const doc = new docx.Document({
    sections: [
      {
        properties: {},
        children: questions.map(
          (question) =>
            new docx.Paragraph({
              text: question,
            })
        ),
      },
    ],
  });

  docx.Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(`${filePath}.docx`, buffer);
  });
};

const writeFinalFile = (filePath, content) => {
  fs.writeFile(`${filePath}.txt`, content, () => {});
};

const fixAnswersInFile = (filePath) => {
  docxParser.parseDocx(filePath, (testContent) => {
    const questions = extractQuestions(testContent);
    console.log(testContent);

    const fixedQuestions = questions.map(hideAnswers);

    const finalFilePath = filePath
      .replace(filesPath, distPath)
      .replace(".docx", "-מתוקן");

    writeFinalFile(finalFilePath, getFinalFileContent(fixedQuestions));
  });
};

fs.readdir("./files", (_, files) => {
  files
    .filter((file) => file.endsWith(".docx"))
    .forEach((fileName) => {
      fixAnswersInFile(`${filesPath}/${fileName}`);
    });
});
