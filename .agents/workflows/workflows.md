---
description: 
---

<Workflow id="workflows">
  <Step sequence="1" role="PM">
    <Action>
      ユーザーの要望を解析し、定量的・論理的な「requirements.md」を作成せよ。
    </Action>
    <Verification method="CoVe">
      作成した要件に論理的な矛盾がないか、実現不可能な技術要素が含まれていないかを3段階で検証し、その結果をドキュメント末尾に付記せよ。
    </Verification>
  </Step>

  <Step sequence="2" role="Architect">
    <Action>
      requirements.mdに基づき、最適なディレクトリ構造とインターフェースを定義した「architecture.md」を作成せよ。
    </Action>
    <Verification method="CrossReference">
      定義した構造が、ターゲット言語（Python/TypeScript等）のベストプラクティスおよび標準ライブラリの仕様と合致しているか確認せよ。
    </Verification>
  </Step>

  <Step sequence="3" role="Developer">
    <Action>
      architecture.mdに従い、ソースコードを完全に実装せよ。
      ライブラリのインポート、変数定義、エラーハンドリングを省略せず全て記述すること。
    </Action>
    <Verification method="SelfReference">
      生成したコードが、定義した要件（Step 1）をすべて満たしているか、未実装の関数がないかを確認せよ。
    </Verification>
  </Step>

  <Step sequence="4" role="QA">
    <Action>
      実装された全ファイルを対象に、静的解析および論理フローの脆弱性監査を実行せよ。
    </Action>
    <Output>
      問題点がある場合は「REJECT: [理由]」を出力しDeveloperへ差し戻せ。
      問題がなければ「APPROVE: [最終確認完了]」と出力し、開発を終了せよ。
    </Output>
  </Step>
</Workflow>