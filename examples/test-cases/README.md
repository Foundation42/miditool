# MIDITool Test Cases

This directory contains a series of test musical projects with increasing complexity to validate the enhanced pipeline implementation.

## Test Case Categories

1. **Basic Tests**: Single-track, single-clip musical ideas
2. **Intermediate Tests**: Multi-track projects with simple relationships
3. **Advanced Tests**: Complex projects with rich musical interactions
4. **Edge Cases**: Specialized tests for specific challenges

## Using These Test Cases

1. **Initial Testing**: Use the basic test cases to validate core pipeline functionality
2. **Progress Testing**: Move to intermediate and advanced tests as pipeline features improve
3. **Edge Case Validation**: Use edge cases to test the limits of the system
4. **Comparative Analysis**: Run the same tests through different pipeline configurations
5. **Documentation**: Document the results of each test for comparison

## Success Metrics

For each test case, evaluate:

1. **Contextual Adherence**: How well does the output follow the specified context?
2. **Musical Coherence**: Is the output musically logical and coherent?
3. **Technical Accuracy**: Are there MIDI errors or technical issues?
4. **Expressive Quality**: Does the output capture the intended emotional character?
5. **Pipeline Performance**: Processing time, token usage, and retry count

## Test Execution

Run these tests with:

```bash
bun run test-pipeline-case <test-case-file> [--pipeline=default|enhanced|...]
```

This command will:
1. Load the test case JSON
2. Process it through the specified pipeline
3. Save the generated MIDI files
4. Generate a test report with success metrics