from cv_adapt import cv_adapt


def test_main(capsys):  # capsys is a fixture provided by pytest
    cv_adapt.main()
    captured = capsys.readouterr()
    assert captured.out == "Hello from cv-adapt!\n"
    assert captured.err == ""
