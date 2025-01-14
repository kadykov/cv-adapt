from pytest import CaptureFixture

from cv_adapter import cv_adapt


def test_main(capsys: CaptureFixture[str]) -> None:
    cv_adapt.main()
    captured = capsys.readouterr()
    assert captured.out == "Hello from cv-adapt!\n"
    assert captured.err == ""
